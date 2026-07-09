import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogModule } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';

import { PollingsComponent } from './pollings.component';
import { PollingService } from '../services/polling.service';
import { MemberService } from '../services/member.service';
import { StorageService } from '../services/storage.service';
import { PollingSummary } from '../interfaces/polling-summary';

function makeRow(overrides: Partial<PollingSummary> = {}): PollingSummary {
  return {
    polling_id: 10,
    polling_name: 'P',
    start_date: '',
    end_date: '',
    polling_order_id: 1,
    candidate_id: 100,
    polling_candidate_id: 1,
    name: 'Cand',
    polling_notes_id: 0,
    note: '',
    vote: null as unknown as number,
    pn_created_at: '',
    polling_order_member_id: 1,
    completed: false,
    ...overrides
  };
}

describe('PollingsComponent', () => {
  let component: PollingsComponent;
  let fixture: ComponentFixture<PollingsComponent>;
  let pollingServiceSpy: jasmine.SpyObj<PollingService>;

  beforeEach(async () => {
    pollingServiceSpy = jasmine.createSpyObj('PollingService', ['getCurrentPolling', 'getPollingSummary', 'createPollingNotes']);
    const memberServiceSpy = jasmine.createSpyObj('MemberService', ['getAllOrderMembers']);
    const storageServiceSpy = jasmine.createSpyObj('StorageService', ['getMember', 'getPollingOrder', 'isLoggedIn']);

    pollingServiceSpy.getCurrentPolling.and.returnValue(of(null as any));
    pollingServiceSpy.getPollingSummary.and.returnValue(of([]));
    pollingServiceSpy.createPollingNotes.and.returnValue(of(undefined as any));
    memberServiceSpy.getAllOrderMembers.and.returnValue(of([]));
    storageServiceSpy.getMember.and.returnValue({ access_token: 'token', memberId: 1, isOrderAdmin: false });
    storageServiceSpy.getPollingOrder.and.returnValue({ polling_order_id: 1, polling_order_name: 'Test' });

    await TestBed.configureTestingModule({
      imports: [PollingsComponent, NoopAnimationsModule, MatDialogModule],
      providers: [
        { provide: PollingService, useValue: pollingServiceSpy },
        { provide: MemberService, useValue: memberServiceSpy },
        { provide: StorageService, useValue: storageServiceSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PollingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('auto-save drafts', () => {
    it('onRowChange skips entirely-empty rows (no createPollingNotes)', fakeAsync(() => {
      const row = makeRow({ note: '   ', vote: null as unknown as number });
      component.onRowChange(row);
      tick(1500);
      expect(pollingServiceSpy.createPollingNotes).not.toHaveBeenCalled();
    }));

    it('onRowChange flips completed to false when a row with meaningful input is edited (banner shows draft state)', () => {
      component.completed = true;
      const row = makeRow({ vote: 1 });
      component.onRowChange(row);
      expect(component.completed).toBeFalse();
    });

    it('onRowChange fires createPollingNotes after ~1000ms for a row with a vote', fakeAsync(() => {
      const row = makeRow({ vote: 1 });
      component.onRowChange(row);
      tick(999);
      expect(pollingServiceSpy.createPollingNotes).not.toHaveBeenCalled();
      tick(2);
      expect(pollingServiceSpy.createPollingNotes).toHaveBeenCalledTimes(1);
    }));

    it('onRowChange fires for a row with a non-empty note', fakeAsync(() => {
      const row = makeRow({ note: 'hello', vote: null as unknown as number });
      component.onRowChange(row);
      tick(1001);
      expect(pollingServiceSpy.createPollingNotes).toHaveBeenCalledTimes(1);
    }));

    it('autoSaveRow posts a 1-element array with completed:false using votingMember, never completed:true', fakeAsync(() => {
      component.votingMember = 42;
      const row = makeRow({ vote: 1, note: 'x' });
      component.onRowChange(row);
      tick(1001);

      expect(pollingServiceSpy.createPollingNotes).toHaveBeenCalledTimes(1);
      const args = pollingServiceSpy.createPollingNotes.calls.mostRecent().args;
      const sentBody = args[0] as any[];
      const memberId = args[2];
      expect(Array.isArray(sentBody)).toBeTrue();
      expect(sentBody.length).toBe(1);
      expect(sentBody[0].completed).toBeFalse();
      expect(memberId).toBe(42);
      // never completed:true
      expect(sentBody[0].completed).not.toBeTrue();
    }));

    it('rapid changes to the same row coalesce to ONE createPollingNotes call', fakeAsync(() => {
      const row = makeRow({ vote: 1 });
      component.onRowChange(row);
      tick(300);
      row.note = 'a';
      component.onRowChange(row);
      tick(300);
      row.note = 'ab';
      component.onRowChange(row);
      tick(1001);
      expect(pollingServiceSpy.createPollingNotes).toHaveBeenCalledTimes(1);
    }));

    it('autoSaveStatus transitions saving -> saved on success', fakeAsync(() => {
      const row = makeRow({ vote: 1 });
      component.onRowChange(row);
      tick(1001);
      expect(component.autoSaveStatus).toBe('saved');
    }));

    it('error path sets autoSaveStatus to error without throwing', fakeAsync(() => {
      pollingServiceSpy.createPollingNotes.and.returnValue(throwError(() => new Error('boom')));
      const row = makeRow({ vote: 1 });
      expect(() => {
        component.onRowChange(row);
        tick(1001);
      }).not.toThrow();
      expect(component.autoSaveStatus).toBe('error');
    }));

    it('does not auto-save while a full submit is in flight', fakeAsync(() => {
      component.isSubmitting = true;
      const row = makeRow({ vote: 1 });
      component.onRowChange(row);
      tick(1500);
      expect(pollingServiceSpy.createPollingNotes).not.toHaveBeenCalled();
    }));

    it('clears pending timers on destroy (no save fires)', fakeAsync(() => {
      const row = makeRow({ vote: 1 });
      component.onRowChange(row);
      tick(300);
      component.ngOnDestroy();
      tick(1500);
      expect(pollingServiceSpy.createPollingNotes).not.toHaveBeenCalled();
    }));

    it('clears pending timers on changeVoter (no save fires for the old voter)', fakeAsync(() => {
      const row = makeRow({ vote: 1 });
      component.onRowChange(row);
      tick(300);
      const evt = { target: { value: '99' } } as unknown as Event;
      component.changeVoter(evt);
      tick(1500);
      expect(pollingServiceSpy.createPollingNotes).not.toHaveBeenCalled();
    }));
  });
});
