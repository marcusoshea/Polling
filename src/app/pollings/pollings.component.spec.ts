import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of, throwError, Subject } from 'rxjs';

import { PollingsComponent, PollingCandidate } from './pollings.component';
import { PollingService } from '../services/polling.service';
import { MemberService } from '../services/member.service';
import { StorageService } from '../services/storage.service';
import { NotesService } from '../services/notes.service';
import { CandidateService } from '../services/candidate.service';
import { ToastService } from '../services/toast.service';
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
  let toastServiceSpy: jasmine.SpyObj<ToastService>;

  beforeEach(async () => {
    pollingServiceSpy = jasmine.createSpyObj('PollingService', ['getCurrentPolling', 'getPollingSummary', 'createPollingNotes']);
    const memberServiceSpy = jasmine.createSpyObj('MemberService', ['getAllOrderMembers']);
    const storageServiceSpy = jasmine.createSpyObj('StorageService', ['getMember', 'getPollingOrder', 'isLoggedIn']);
    toastServiceSpy = jasmine.createSpyObj('ToastService', ['show', 'dismiss']);

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
        { provide: StorageService, useValue: storageServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy }
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

  describe('accessibility labels on voting controls', () => {
    it('renders a per-row aria-label on the note textarea and vote select', () => {
      component.currentPolling = { polling_id: 10, polling_name: 'P' };
      component.dataSourcePS.data = [makeRow({ name: 'Alice', candidate_id: 100 })];
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      const textarea = el.querySelector('textarea[name="note"]');
      expect(textarea?.getAttribute('aria-label')).toBe('Note for Alice');
      expect(textarea?.getAttribute('id')).toBe('note-100');

      // mat-select / mat-checkbox render the aria-label onto an internal element
      // that varies by Material version, so assert the accessible name appears
      // in the control's rendered markup rather than pinning an exact host attr.
      const voteSelect = el.querySelector('mat-select');
      expect(voteSelect).toBeTruthy();
      expect(voteSelect?.outerHTML).toContain('Your vote for Alice');

      const checkbox = el.querySelector('mat-checkbox');
      expect(checkbox).toBeTruthy();
      expect(checkbox?.outerHTML).toContain('Mark note private for Alice');
    });
  });

  describe('auto-save drafts (batched)', () => {
    it('editing 3 different rows within 1s produces ONE createPollingNotes call with 3 rows, all completed:false', fakeAsync(() => {
      component.votingMember = 42;
      const rowA = makeRow({ candidate_id: 100, vote: 1 });
      const rowB = makeRow({ candidate_id: 200, note: 'b' });
      const rowC = makeRow({ candidate_id: 300, vote: 3, note: 'c' });
      component.onRowChange(rowA);
      tick(300);
      component.onRowChange(rowB);
      tick(300);
      component.onRowChange(rowC);
      tick(1001);

      expect(pollingServiceSpy.createPollingNotes).toHaveBeenCalledTimes(1);
      const args = pollingServiceSpy.createPollingNotes.calls.mostRecent().args;
      const sentBody = args[0] as any[];
      const memberId = args[2];
      expect(Array.isArray(sentBody)).toBeTrue();
      expect(sentBody.length).toBe(3);
      expect(sentBody.map(r => r.candidate_id).sort((a, b) => a - b)).toEqual([100, 200, 300]);
      sentBody.forEach(r => expect(r.completed).toBeFalse());
      expect(memberId).toBe(42);
    }));

    it('re-editing the same row before flush coalesces to ONE call with ONE row carrying the freshest values', fakeAsync(() => {
      const row = makeRow({ candidate_id: 100, vote: 1 });
      component.onRowChange(row);
      tick(300);
      row.note = 'a';
      component.onRowChange(row);
      tick(300);
      row.note = 'ab';
      row.vote = 2;
      component.onRowChange(row);
      tick(1001);

      expect(pollingServiceSpy.createPollingNotes).toHaveBeenCalledTimes(1);
      const sentBody = pollingServiceSpy.createPollingNotes.calls.mostRecent().args[0] as any[];
      expect(sentBody.length).toBe(1);
      expect(sentBody[0].note).toBe('ab');
      expect(sentBody[0].vote).toBe(2);
      expect(sentBody[0].completed).toBeFalse();
    }));

    it('an edit during an in-flight flush never overlaps requests: second flush fires after the first completes (2 calls total)', fakeAsync(() => {
      const first$ = new Subject<any>();
      pollingServiceSpy.createPollingNotes.and.returnValues(first$ as any, of(undefined as any));

      const rowA = makeRow({ candidate_id: 100, vote: 1 });
      component.onRowChange(rowA);
      tick(1001);
      expect(pollingServiceSpy.createPollingNotes).toHaveBeenCalledTimes(1);

      // Edit another row while the first flush is still in flight.
      const rowB = makeRow({ candidate_id: 200, vote: 2 });
      component.onRowChange(rowB);
      tick(1001);
      // Timer fired while in flight -> deferred, no concurrent request.
      expect(pollingServiceSpy.createPollingNotes).toHaveBeenCalledTimes(1);

      // Complete the first flush; the re-armed timer then fires the second flush.
      first$.next(undefined);
      first$.complete();
      tick(1001);
      expect(pollingServiceSpy.createPollingNotes).toHaveBeenCalledTimes(2);
      const secondBody = pollingServiceSpy.createPollingNotes.calls.argsFor(1)[0] as any[];
      expect(secondBody.length).toBe(1);
      expect(secondBody[0].candidate_id).toBe(200);
      expect(secondBody[0].completed).toBeFalse();
    }));

    it('flush error sets status to error, retains the rows, and the next edit retries them in one batch', fakeAsync(() => {
      pollingServiceSpy.createPollingNotes.and.returnValue(throwError(() => ({ error: { message: 'boom' } })));
      const rowA = makeRow({ candidate_id: 100, vote: 1 });
      expect(() => {
        component.onRowChange(rowA);
        tick(1001);
      }).not.toThrow();
      expect(pollingServiceSpy.createPollingNotes).toHaveBeenCalledTimes(1);
      expect(component.autoSaveStatus).toBe('error');

      // Next edit (a different row) retries the previously-failed row in the same batch.
      pollingServiceSpy.createPollingNotes.and.returnValue(of(undefined as any));
      const rowB = makeRow({ candidate_id: 200, note: 'b' });
      component.onRowChange(rowB);
      tick(1001);
      expect(pollingServiceSpy.createPollingNotes).toHaveBeenCalledTimes(2);
      const retryBody = pollingServiceSpy.createPollingNotes.calls.mostRecent().args[0] as any[];
      expect(retryBody.map(r => r.candidate_id).sort((a, b) => a - b)).toEqual([100, 200]);
      retryBody.forEach(r => expect(r.completed).toBeFalse());
      expect(component.autoSaveStatus).toBe('saved');
    }));

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

    it('flush fires ~1000ms after the LAST edit (single shared debounce)', fakeAsync(() => {
      const row = makeRow({ vote: 1 });
      component.onRowChange(row);
      tick(999);
      expect(pollingServiceSpy.createPollingNotes).not.toHaveBeenCalled();
      tick(2);
      expect(pollingServiceSpy.createPollingNotes).toHaveBeenCalledTimes(1);
    }));

    it('autoSaveStatus transitions saving -> saved on success and auto-clears', fakeAsync(() => {
      const row = makeRow({ vote: 1 });
      component.onRowChange(row);
      tick(1001);
      expect(component.autoSaveStatus).toBe('saved');
      tick(3001);
      expect(component.autoSaveStatus).toBe('');
    }));

    it('does not auto-save while a full submit is in flight', fakeAsync(() => {
      component.isSubmitting = true;
      const row = makeRow({ vote: 1 });
      component.onRowChange(row);
      tick(1500);
      expect(pollingServiceSpy.createPollingNotes).not.toHaveBeenCalled();
    }));

    it('clears pending work on destroy (no save fires)', fakeAsync(() => {
      const row = makeRow({ vote: 1 });
      component.onRowChange(row);
      tick(300);
      component.ngOnDestroy();
      tick(1500);
      expect(pollingServiceSpy.createPollingNotes).not.toHaveBeenCalled();
    }));

    it('clears pending work on changeVoter (no save fires for the old voter)', fakeAsync(() => {
      const row = makeRow({ vote: 1 });
      component.onRowChange(row);
      tick(300);
      const evt = { target: { value: '99' } } as unknown as Event;
      component.changeVoter(evt);
      tick(1500);
      expect(pollingServiceSpy.createPollingNotes).not.toHaveBeenCalled();
    }));

    it('auto-save errors do NOT raise a toast (inline status line only)', fakeAsync(() => {
      pollingServiceSpy.createPollingNotes.and.returnValue(throwError(() => ({ error: { message: 'boom' } })));
      const row = makeRow({ vote: 1 });
      component.onRowChange(row);
      tick(1001);
      expect(component.autoSaveStatus).toBe('error');
      expect(toastServiceSpy.show).not.toHaveBeenCalled();
    }));
  });

  describe('error surfacing via toasts', () => {
    it('submitPolling error path calls ToastService.show with the server message', () => {
      pollingServiceSpy.createPollingNotes.and.returnValue(throwError(() => ({ error: { message: 'Vote failed on the server' } })));
      component.dataSourcePS.data = [makeRow({ vote: 1 })];

      component.submitPolling(true);

      expect(toastServiceSpy.show).toHaveBeenCalledWith('Vote failed on the server');
      expect(component.isSubmitting).toBeFalse();
    });

    it('submitPolling error path falls back to a friendly message when the error has no message', () => {
      pollingServiceSpy.createPollingNotes.and.returnValue(throwError(() => ({ error: {} })));
      component.dataSourcePS.data = [makeRow({ vote: 1 })];

      component.submitPolling(true);

      expect(toastServiceSpy.show).toHaveBeenCalledWith('Your vote could not be submitted. Please try again.');
    });
  });
});

describe('PollingCandidate dialog', () => {
  let notesServiceSpy: jasmine.SpyObj<NotesService>;
  let candidateServiceSpy: jasmine.SpyObj<CandidateService>;

  const dialogData = {
    candidate: { candidate_id: 100, name: 'Cand', link: '' },
    accessToken: 'token'
  };

  async function setup(myNotes: any): Promise<PollingCandidate> {
    notesServiceSpy = jasmine.createSpyObj('NotesService', [
      'getExternalNoteByCandidateId',
      'getPollingNoteByCandidateId',
      'getMyPollingNotesByCandidateId'
    ]);
    candidateServiceSpy = jasmine.createSpyObj('CandidateService', ['getAllCandidateImages']);

    notesServiceSpy.getExternalNoteByCandidateId.and.returnValue(of([]));
    notesServiceSpy.getPollingNoteByCandidateId.and.returnValue(of([]));
    notesServiceSpy.getMyPollingNotesByCandidateId.and.returnValue(of(myNotes));
    candidateServiceSpy.getAllCandidateImages.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [PollingCandidate, NoopAnimationsModule, MatDialogModule],
      providers: [
        { provide: NotesService, useValue: notesServiceSpy },
        { provide: CandidateService, useValue: candidateServiceSpy },
        { provide: MatDialogRef, useValue: { close: () => {} } },
        { provide: MAT_DIALOG_DATA, useValue: dialogData }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(PollingCandidate);
    return fixture.componentInstance;
  }

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('calls getMyPollingNotesByCandidateId with the candidate id and token', async () => {
    await setup([]);
    expect(notesServiceSpy.getMyPollingNotesByCandidateId).toHaveBeenCalledWith(100, 'token');
  });

  it('groups the response into myPollingNames (unique, end_date DESC) and myPollingNotes (array of arrays)', async () => {
    const notes = [
      { polling_name: 'Older', end_date: '2025-01-01T00:00:00.000Z', vote: 1, note: 'a', private: false },
      { polling_name: 'Newer', end_date: '2026-01-01T00:00:00.000Z', vote: 2, note: 'b', private: true },
      { polling_name: 'Newer', end_date: '2026-01-01T00:00:00.000Z', vote: 3, note: 'c', private: false }
    ];
    const dialog = await setup(notes);

    expect(dialog.myPollingNames).toEqual(['Newer', 'Older']);
    expect(dialog.myPollingNotes.length).toBe(2);
    expect(dialog.myPollingNotes[0].length).toBe(2); // Newer has two notes
    expect(dialog.myPollingNotes[1].length).toBe(1); // Older has one note
  });

  it('empty response yields empty state (myPollingNames empty)', async () => {
    const dialog = await setup([]);
    expect(dialog.myPollingNames.length).toBe(0);
    expect(dialog.myPollingNotes.length).toBe(0);
  });

  it('null response is handled gracefully (guarded to empty)', async () => {
    const dialog = await setup(null);
    expect(dialog.myPollingNames.length).toBe(0);
    expect(dialog.myPollingNotes.length).toBe(0);
  });
});
