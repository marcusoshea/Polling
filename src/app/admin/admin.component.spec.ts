import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { MatDialogModule } from '@angular/material/dialog';
import { ReactiveFormsModule } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { AdminComponent } from './admin.component';
import { MemberService } from '../services/member.service';
import { StorageService } from '../services/storage.service';
import { PollingOrderService } from '../services/polling-order.service';
import { CandidateService } from '../services/candidate.service';
import { PollingService } from '../services/polling.service';
import { AuthService } from '../services/auth.service';
import { PollingReportService } from '../services/polling-report.service';
import { NotesService } from '../services/notes.service';
import { OrderPoliciesService } from '../services/order-policies.service';
import pdfMakeImport from 'pdfmake/build/pdfmake';
import pdfFontsImport from 'pdfmake/build/vfs_fonts';

describe('AdminComponent', () => {
  let component: AdminComponent;
  let fixture: ComponentFixture<AdminComponent>;

  beforeEach(async () => {
    const memberServiceSpy = jasmine.createSpyObj('MemberService', ['getAllOrderMembers', 'updateMember', 'removeMember']);
    const storageServiceSpy = jasmine.createSpyObj('StorageService', ['getMember', 'getPollingOrder', 'isLoggedIn', 'clean']);
    const pollingOrderServiceSpy = jasmine.createSpyObj('PollingOrderService', ['getAllOrders', 'updatePollingOrder']);
    const candidateServiceSpy = jasmine.createSpyObj('CandidateService', ['getAllCandidates', 'createCandidate', 'removeCandidate', 'editCandidate', 'getAllCandidateImages']);
    const pollingServiceSpy = jasmine.createSpyObj('PollingService', ['getAllPollings', 'getCurrentPolling', 'createPolling', 'removePolling', 'getMissingVotesReport', 'createPollingCandidates', 'editPolling']);
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['forceRegister']);
    const pollingReportServiceSpy = jasmine.createSpyObj('PollingReportService', ['getClosedPollingReport', 'getSpecificPollingReport']);
    const notesServiceSpy = jasmine.createSpyObj('NotesService', ['getAllPollingNotesById']);
    const orderPoliciesServiceSpy = jasmine.createSpyObj('OrderPoliciesService', ['getOrderPolicyByPollingOrderId', 'createOrderPolicy', 'updateOrderPolicy', 'deleteOrderPolicy']);

    storageServiceSpy.getMember.and.returnValue({
      access_token: 'token',
      memberId: 1,
      isOrderAdmin: true
    });
    storageServiceSpy.getPollingOrder.and.returnValue({
      polling_order_id: 1,
      polling_order_name: 'Test Order',
      polling_order_admin: 1,
      polling_order_admin_assistant: 1
    });
    memberServiceSpy.getAllOrderMembers.and.returnValue(of([]));
    candidateServiceSpy.getAllCandidates.and.returnValue(of([]));
    pollingServiceSpy.getAllPollings.and.returnValue(of([]));
    orderPoliciesServiceSpy.getOrderPolicyByPollingOrderId.and.returnValue(of(null));

    await TestBed.configureTestingModule({
      imports: [
        AdminComponent,
        NoopAnimationsModule,
        RouterModule.forRoot([]),
        MatDialogModule,
        ReactiveFormsModule
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MemberService, useValue: memberServiceSpy },
        { provide: StorageService, useValue: storageServiceSpy },
        { provide: PollingOrderService, useValue: pollingOrderServiceSpy },
        { provide: CandidateService, useValue: candidateServiceSpy },
        { provide: PollingService, useValue: pollingServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: PollingReportService, useValue: pollingReportServiceSpy },
        { provide: NotesService, useValue: notesServiceSpy },
        { provide: OrderPoliciesService, useValue: orderPoliciesServiceSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('closed report PDF export', () => {
    function baseReport(): any {
      return {
        pollingOrderName: 'Test Order',
        pollingTitle: 'Spring Polling',
        startDate: '2026-01-01',
        endDate: '2026-02-01',
        pollingOrderPollingType: 1,
        pollingOrderParticipation: 50,
        pollingOrderScore: 0,
        participatingMembers: 10,
        activeMembers: 20,
        participationRate: '50.00',
        certified: 'certified.',
        candidateList: [
          { name: 'Alice', rating: 80 },
          { name: 'Bob', rating: 20 }
        ],
        pollingTotal: [
          { name: 'Alice', vote: 'Yes', total: '5' },
          { name: 'Alice', vote: 'Wait', total: '2' },
          { name: 'Bob', vote: 'No', total: '3' }
        ]
      };
    }

    function findTable(doc: any): any {
      return doc.content.find((c: any) => c.table)?.table;
    }

    // Notes render as bulleted lists: { ul: [ '...note line...', ... ] }.
    // Collect every bullet string across all ul nodes.
    function noteStrings(doc: any): string[] {
      const out: string[] = [];
      (doc.content || []).forEach((c: any) => {
        if (c && Array.isArray(c.ul)) {
          c.ul.forEach((item: any) => out.push(typeof item === 'string' ? item : (item?.text ?? '')));
        }
      });
      return out;
    }

    beforeEach(() => {
      component.closedPollingReport = baseReport();
      component.showAdminNotes = true;
      component.showAdminPrivateNotes = true;
      component.showAdminVotes = true;
    });

    describe('voteTotalsFor', () => {
      it('tallies Yes/Wait/No/Abstain/Null from closedPollingReport.pollingTotal', () => {
        component.closedPollingReport.pollingTotal = [
          { name: 'Alice', vote: 'Yes', total: '3' },
          { name: 'Alice', vote: 'Wait', total: '2' },
          { name: 'Alice', vote: 'No', total: '1' },
          { name: 'Alice', vote: 'Abstain', total: '4' },
          { name: 'Alice', vote: 'Null', total: '5' },
          { name: 'Bob', vote: 'Yes', total: '99' }
        ];
        const t = component.voteTotalsFor('Alice');
        expect(t.yes).toBe(3);
        expect(t.wait).toBe(2);
        expect(t.no).toBe(1);
        expect(t.abstain).toBe(9);
      });

      it('returns zeros when closedPollingReport is null', () => {
        component.closedPollingReport = null;
        expect(component.voteTotalsFor('Anyone')).toEqual({ yes: 0, wait: 0, no: 0, abstain: 0 });
      });
    });

    describe('buildClosedReportDocDefinition', () => {
      it('includes the Recommended? column only when pollingOrderScore > 0', () => {
        component.closedPollingReport.pollingOrderScore = 0;
        let table = findTable(component.buildClosedReportDocDefinition());
        expect(table.body[0].map((h: any) => h.text)).not.toContain('Recommended?');

        component.closedPollingReport.pollingOrderScore = 60;
        table = findTable(component.buildClosedReportDocDefinition());
        const headerTexts = table.body[0].map((h: any) => h.text);
        expect(headerTexts).toContain('Recommended?');
        const lastCol = table.body[0].length - 1;
        expect(table.body[1][lastCol]).toBe('Yes'); // Alice 80 >= 60
        expect(table.body[2][lastCol]).toBe('No');  // Bob 20 < 60
      });

      it('always includes tally counts, regardless of showAdminVotes', () => {
        component.showAdminVotes = false;
        const table = findTable(component.buildClosedReportDocDefinition());
        // Alice row: Yes=5, Wait=2, No=0, Abstain=0
        expect(table.body[1][1]).toBe('5');
        expect(table.body[1][2]).toBe('2');
        // Bob row: No=3
        expect(table.body[2][3]).toBe('3');
      });

      it('renders no notes section when showAdminNotes is false', () => {
        component.showAdminNotes = false;
        component.closedPollingReport.candidateList = [
          { name: 'Alice', rating: 80, notes: [{ note: 'Great', member_name: 'R1', private: false, vote: 1, completed: true }] }
        ];
        const doc = component.buildClosedReportDocDefinition();
        const headings = doc.content.filter((c: any) => c.style === 'candidateHeading');
        expect(headings.length).toBe(0);
      });

      it('renders notes when showAdminNotes is true', () => {
        component.closedPollingReport.candidateList = [
          { name: 'Alice', rating: 80, notes: [{ note: 'Great', member_name: 'R1', private: false, vote: 1, completed: true }] }
        ];
        const doc = component.buildClosedReportDocDefinition();
        const heading = doc.content.find((c: any) => c.style === 'candidateHeading' && c.text === 'Alice');
        expect(heading).toBeTruthy();
        const note = noteStrings(doc).find((s) => s.includes('Great'));
        expect(note).toBeTruthy();
        expect(note).toContain('R1');
      });

      it('excludes private notes when showAdminPrivateNotes is false', () => {
        component.showAdminPrivateNotes = false;
        component.closedPollingReport.candidateList = [
          { name: 'Alice', rating: 80, notes: [{ note: 'Confidential', member_name: 'R2', private: true, vote: 3, completed: true }] }
        ];
        const doc = component.buildClosedReportDocDefinition();
        expect(noteStrings(doc).find((s) => s.includes('Confidential'))).toBeUndefined();
        const headings = doc.content.filter((c: any) => c.style === 'candidateHeading');
        expect(headings.length).toBe(0);
      });

      it('includes private notes with PRIVATE RESPONSE: prefix when showAdminPrivateNotes is true', () => {
        component.showAdminPrivateNotes = true;
        component.closedPollingReport.candidateList = [
          { name: 'Alice', rating: 80, notes: [{ note: 'Confidential', member_name: 'R2', private: true, vote: 3, completed: true }] }
        ];
        const doc = component.buildClosedReportDocDefinition();
        const note = noteStrings(doc).find((s) => s.includes('Confidential'));
        expect(note).toBeTruthy();
        expect(note).toContain('PRIVATE RESPONSE: ');
      });

      it('omits vote words and skips text-less notes when showAdminVotes is false', () => {
        component.showAdminVotes = false;
        component.closedPollingReport.candidateList = [
          {
            name: 'Alice',
            rating: 80,
            notes: [
              { note: 'Has text', member_name: 'R1', private: false, vote: 1, completed: true },
              { note: '', member_name: 'R2', private: false, vote: 2, completed: true }
            ]
          }
        ];
        const doc = component.buildClosedReportDocDefinition();
        const notes = noteStrings(doc);
        const note = notes.find((s) => s.includes('Has text'));
        expect(note).toBeTruthy();
        // vote word for vote===1 ('Yes') must NOT appear as a standalone vote token
        expect(note).not.toContain('Yes ---');
        expect(note!.startsWith('Yes')).toBeFalse();
        // text-less note (R2) skipped entirely
        expect(notes.find((s) => s.includes('R2'))).toBeUndefined();
      });
    });

    describe('exportClosedReportPdf gate', () => {
      it('no-ops (does not build the doc) when showAdmin is false', () => {
        (component as any).showAdmin = false;
        const buildSpy = spyOn(component, 'buildClosedReportDocDefinition').and.callThrough();
        component.exportClosedReportPdf();
        expect(buildSpy).not.toHaveBeenCalled();
      });

      it('no-ops when closedPollingReport is null', () => {
        (component as any).showAdmin = true;
        component.closedPollingReport = null;
        const buildSpy = spyOn(component, 'buildClosedReportDocDefinition').and.callThrough();
        component.exportClosedReportPdf();
        expect(buildSpy).not.toHaveBeenCalled();
      });
    });

    describe('runtime pdfmake vfs/fonts smoke test', () => {
      it('produces a non-empty PDF Blob (proves vfs/fonts wiring)', (done) => {
        const pdfMake: any = (pdfMakeImport as any)?.default ?? pdfMakeImport;
        const pdfFonts: any = (pdfFontsImport as any)?.default ?? pdfFontsImport;
        pdfMake.vfs = pdfFonts?.vfs ?? pdfFonts?.pdfMake?.vfs ?? pdfFonts;

        pdfMake.createPdf(component.buildClosedReportDocDefinition()).getBlob((blob: Blob) => {
          expect(blob.size).toBeGreaterThan(0);
          done();
        });
      });
    });
  });
});
