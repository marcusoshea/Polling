import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ReportComponent } from './report.component';
import { PollingService } from '../services/polling.service';
import { StorageService } from '../services/storage.service';
import { NotesService } from '../services/notes.service';
import { PollingReportService } from '../services/polling-report.service';
import { ToastService } from '../services/toast.service';

describe('ReportComponent', () => {
  let component: ReportComponent;
  let fixture: ComponentFixture<ReportComponent>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;

  beforeEach(async () => {
    const pollingServiceSpy = jasmine.createSpyObj('PollingService', ['getInProcessPollingReport', 'getPollingSummary']);
    const storageServiceSpy = jasmine.createSpyObj('StorageService', ['getMember', 'getPollingOrder', 'isLoggedIn']);
    const notesServiceSpy = jasmine.createSpyObj('NotesService', ['getAllPollingNotesById', 'getPollingReportTotals']);
    const pollingReportServiceSpy = jasmine.createSpyObj('PollingReportService', ['getClosedPollingReport', 'getSpecificPollingReport']);
    toastServiceSpy = jasmine.createSpyObj('ToastService', ['show', 'dismiss']);

    storageServiceSpy.getMember.and.returnValue({ access_token: 'token', memberId: 1, isOrderAdmin: false });
    storageServiceSpy.getPollingOrder.and.returnValue({ polling_order_id: 1, polling_order_name: 'Test' });
    pollingReportServiceSpy.getClosedPollingReport.and.returnValue(of(null));

    await TestBed.configureTestingModule({
      imports: [ReportComponent, NoopAnimationsModule, RouterModule.forRoot([])],
      providers: [
        { provide: PollingService, useValue: pollingServiceSpy },
        { provide: StorageService, useValue: storageServiceSpy },
        { provide: NotesService, useValue: notesServiceSpy },
        { provide: PollingReportService, useValue: pollingReportServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('reportBuilder does not throw for a new in-process polling with no submitted notes (null notes/totals)', () => {
    const notesService = TestBed.inject(NotesService) as jasmine.SpyObj<NotesService>;
    // A brand-new polling with nothing submitted: the notes endpoint returns null.
    notesService.getAllPollingNotesById.and.returnValue(of(null as any));
    notesService.getPollingReportTotals.and.returnValue(of(null as any));
    const data = [
      { polling_id: 5, polling_name: 'New Polling', start_date: '2026-07-01T00:00:00', end_date: '2026-07-31T00:00:00', polling_order_polling_type: 1, polling_order_polling_participation: 50, polling_order_polling_score: 70, polling_order_name: 'Test' },
      { active_members: 10 },
      { member_participation: 0 }
    ];
    expect(() => component.reportBuilder(data)).not.toThrow();
    expect(component.candidateList).toEqual([]);
    expect(component.allPollingNotes).toEqual([]);
  });

  describe('error surfacing via toasts', () => {
    it('closed report fetch error calls ToastService.show with the server message', () => {
      const pollingReportService = TestBed.inject(PollingReportService) as jasmine.SpyObj<PollingReportService>;
      pollingReportService.getClosedPollingReport.and.returnValue(throwError(() => ({ error: { message: 'Report backend down' } })));

      component.showInProcessReport = false;
      component.initialReportBuilder();

      expect(toastServiceSpy.show).toHaveBeenCalledWith('Report backend down');
    });

    it('in-process report fetch error calls ToastService.show with a fallback when no message', () => {
      const pollingService = TestBed.inject(PollingService) as jasmine.SpyObj<PollingService>;
      pollingService.getInProcessPollingReport.and.returnValue(throwError(() => ({ error: {} })));

      component.showInProcessReport = true;
      component.initialReportBuilder();

      expect(toastServiceSpy.show).toHaveBeenCalledWith('The in-process polling report could not be loaded. Please try again.');
    });
  });
});
