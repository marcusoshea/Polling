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
    it('editing 3 different rows within 1s produces ONE createPollingNotes call with 3 rows, all completed:false while not yet submitted (§2f refined invariant)', fakeAsync(() => {
      component.hasSubmitted = false; // never-submitted member: auto-save must NEVER write completed:true
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

    it('onRowChange flips completed to false when a row with meaningful input is edited while not yet submitted (banner shows draft state)', () => {
      component.hasSubmitted = false;
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
      // Phase 5: a real submit shows the review dialog first — auto-confirm it here.
      spyOn(component.dialog, 'open').and.returnValue({ afterClosed: () => of(true) } as any);
      pollingServiceSpy.createPollingNotes.and.returnValue(throwError(() => ({ error: { message: 'Vote failed on the server' } })));
      component.dataSourcePS.data = [makeRow({ vote: 1 })];

      component.submitPolling(true);

      expect(toastServiceSpy.show).toHaveBeenCalledWith('Vote failed on the server');
      expect(component.isSubmitting).toBeFalse();
    });

    it('submitPolling error path falls back to a friendly message when the error has no message', () => {
      spyOn(component.dialog, 'open').and.returnValue({ afterClosed: () => of(true) } as any);
      pollingServiceSpy.createPollingNotes.and.returnValue(throwError(() => ({ error: {} })));
      component.dataSourcePS.data = [makeRow({ vote: 1 })];

      component.submitPolling(true);

      expect(toastServiceSpy.show).toHaveBeenCalledWith('Your vote could not be submitted. Please try again.');
    });
  });

  describe('progress indicator', () => {
    it('votedCount / totalCandidates count rows with a vote and update after an edit', () => {
      component.dataSourcePS.data = [
        makeRow({ candidate_id: 1, name: 'A', vote: 1 }),
        makeRow({ candidate_id: 2, name: 'B' }),
        makeRow({ candidate_id: 3, name: 'C' })
      ];
      expect(component.votedCount).toBe(1);
      expect(component.totalCandidates).toBe(3);

      component.dataSourcePS.data[1].vote = 3;
      expect(component.votedCount).toBe(2);
      expect(component.totalCandidates).toBe(3);
    });

    it('renders the progress line above the table', () => {
      component.currentPolling = { polling_id: 10, polling_name: 'P' };
      component.dataSourcePS.data = [
        makeRow({ candidate_id: 1, name: 'A', vote: 1 }),
        makeRow({ candidate_id: 2, name: 'B' })
      ];
      fixture.detectChanges();
      expect((fixture.nativeElement as HTMLElement).textContent).toContain('Polled 1 of 2 candidates.');
    });
  });

  describe('deadline countdown', () => {
    function loadPollingEnding(endDate: string): void {
      pollingServiceSpy.getCurrentPolling.and.returnValue(of({
        polling_id: 10,
        polling_name: 'P',
        start_date: '2026-01-01T00:00:00.000Z',
        end_date: endDate
      } as any));
      component.ngOnInit();
    }

    it('computes daysRemaining and renders "— closes in N days"', () => {
      loadPollingEnding(new Date(Date.now() + 5 * 86400000).toISOString());
      expect(component.daysRemaining).toBe(5);
      expect(component.deadlineText).toBe('— closes in 5 days');
      fixture.detectChanges();
      expect((fixture.nativeElement as HTMLElement).textContent).toContain('— closes in 5 days');
    });

    it('shows "— closes today" when the polling ends today (N === 0)', () => {
      loadPollingEnding(new Date().toISOString());
      expect(component.daysRemaining).toBe(0);
      expect(component.deadlineText).toBe('— closes today');
    });

    it('defensively shows "— closing" for an already-past end date', () => {
      loadPollingEnding(new Date(Date.now() - 3 * 86400000).toISOString());
      expect(component.daysRemaining).toBeLessThan(0);
      expect(component.deadlineText).toBe('— closing');
    });
  });

  describe('candidate filter', () => {
    beforeEach(() => {
      component.currentPolling = { polling_id: 10, polling_name: 'P' };
      component.dataSourcePS.data = [
        makeRow({ candidate_id: 1, name: 'Alice' }),
        makeRow({ candidate_id: 2, name: 'Bob', vote: 1 })
      ];
      fixture.detectChanges();
    });

    function typeFilter(value: string): void {
      const input = fixture.nativeElement.querySelector('#candidate-filter') as HTMLInputElement;
      input.value = value;
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    }

    it('has a visible label and an aria-label (a11y conventions)', () => {
      const el: HTMLElement = fixture.nativeElement;
      const input = el.querySelector('#candidate-filter');
      expect(input).toBeTruthy();
      expect(input?.getAttribute('aria-label')).toBe('Filter candidates by name');
      expect(el.querySelector('label[for="candidate-filter"]')?.textContent).toContain('Filter candidates');
    });

    it('reduces the rendered rows by name but leaves dataSourcePS.data untouched', () => {
      expect(fixture.nativeElement.querySelectorAll('table tbody tr').length).toBe(2);

      typeFilter('ali');

      expect(component.dataSourcePS.filteredData.length).toBe(1);
      expect(component.dataSourcePS.filteredData[0].name).toBe('Alice');
      expect(fixture.nativeElement.querySelectorAll('table tbody tr').length).toBe(1);
      // Submit/auto-save read dataSourcePS.data — filtering must never mutate it.
      expect(component.dataSourcePS.data.length).toBe(2);
    });

    it('submit while a filter is active still posts ALL rows', () => {
      typeFilter('ali');
      spyOn(component.dialog, 'open').and.returnValue({ afterClosed: () => of(true) } as any);

      component.submitPolling(true);

      expect(pollingServiceSpy.createPollingNotes).toHaveBeenCalledTimes(1);
      const sentBody = pollingServiceSpy.createPollingNotes.calls.mostRecent().args[0] as any[];
      expect(sentBody.length).toBe(2);
      expect(sentBody.map(r => r.candidate_id).sort((a, b) => a - b)).toEqual([1, 2]);
      sentBody.forEach(r => expect(r.completed).toBeTrue());
    });
  });

  describe('pre-submit review dialog', () => {
    it('a real submit opens the review dialog with the rows and posts completed:true after Confirm', () => {
      const openSpy = spyOn(component.dialog, 'open').and.returnValue({ afterClosed: () => of(true) } as any);
      const rows = [makeRow({ candidate_id: 1, vote: 1 }), makeRow({ candidate_id: 2 })];
      component.dataSourcePS.data = rows;

      component.submitPolling(true);

      expect(openSpy).toHaveBeenCalledTimes(1);
      const dialogConfig = openSpy.calls.mostRecent().args[1] as any;
      // The dialog receives the live rows array (getVotes() replaces dataSourcePS.data after success).
      expect(dialogConfig.data.rows).toBe(rows);
      expect(pollingServiceSpy.createPollingNotes).toHaveBeenCalledTimes(1);
      const sentBody = pollingServiceSpy.createPollingNotes.calls.mostRecent().args[0] as any[];
      sentBody.forEach(r => expect(r.completed).toBeTrue());
    });

    it('Go Back closes the dialog and sends nothing', () => {
      spyOn(component.dialog, 'open').and.returnValue({ afterClosed: () => of(false) } as any);
      component.dataSourcePS.data = [makeRow({ vote: 1 })];

      component.submitPolling(true);

      expect(pollingServiceSpy.createPollingNotes).not.toHaveBeenCalled();
      expect(component.isSubmitting).toBeFalse();
    });

    it('Save Draft bypasses the dialog and posts completed:false immediately', () => {
      const openSpy = spyOn(component.dialog, 'open');
      component.dataSourcePS.data = [makeRow({ candidate_id: 1, vote: 1 })];

      component.submitPolling(false);

      expect(openSpy).not.toHaveBeenCalled();
      expect(pollingServiceSpy.createPollingNotes).toHaveBeenCalledTimes(1);
      const sentBody = pollingServiceSpy.createPollingNotes.calls.mostRecent().args[0] as any[];
      sentBody.forEach(r => expect(r.completed).toBeFalse());
    });
  });

  describe('submit vs auto-save race', () => {
    it('a pending auto-save debounce armed before Submit never fires after it: exactly ONE createPollingNotes call, no trailing completed:false write', fakeAsync(() => {
      spyOn(component.dialog, 'open').and.returnValue({ afterClosed: () => of(true) } as any);
      const row = makeRow({ candidate_id: 100, vote: 1 });
      component.dataSourcePS.data = [row];

      component.onRowChange(row); // arms the 1s auto-save debounce
      tick(300);
      component.submitPolling(true); // Confirm fires synchronously via of(true)

      expect(pollingServiceSpy.createPollingNotes).toHaveBeenCalledTimes(1);
      const sentBody = pollingServiceSpy.createPollingNotes.calls.mostRecent().args[0] as any[];
      sentBody.forEach(r => expect(r.completed).toBeTrue());

      tick(5000); // well past the original debounce window
      // Still only the submit's own call — no auto-save fired afterwards to
      // rewrite the rows with completed:false (the old reload masked this race).
      expect(pollingServiceSpy.createPollingNotes).toHaveBeenCalledTimes(1);
    }));
  });

  describe('in-place submit success (no alert, no reload)', () => {
    it('submit success shows a success toast, refreshes votes in place, and re-enables the buttons', () => {
      spyOn(component.dialog, 'open').and.returnValue({ afterClosed: () => of(true) } as any);
      const getVotesSpy = spyOn(component, 'getVotes');
      component.dataSourcePS.data = [makeRow({ vote: 1 })];

      // No alert() and no window.location.reload() may run in this path.
      expect(() => component.submitPolling(true)).not.toThrow();

      expect(toastServiceSpy.show).toHaveBeenCalledWith('Your polling vote has been submitted.', 'success');
      expect(getVotesSpy).toHaveBeenCalledTimes(1);
      expect(component.isSubmitting).toBeFalse();
    });

    it('Save Draft success shows the draft toast and refreshes votes in place', () => {
      const getVotesSpy = spyOn(component, 'getVotes');
      component.dataSourcePS.data = [makeRow({ vote: 1 })];

      component.submitPolling(false);

      expect(toastServiceSpy.show).toHaveBeenCalledWith('Draft saved — your vote is NOT submitted yet.', 'success');
      expect(getVotesSpy).toHaveBeenCalledTimes(1);
      expect(component.isSubmitting).toBeFalse();
    });
  });

  describe('once submitted, always submitted (§2f)', () => {
    it('getVotes sets hasSubmitted from the loaded rows: fully submitted -> true, any draft row -> false', () => {
      component.currentPolling = { polling_id: 10 };

      pollingServiceSpy.getPollingSummary.and.returnValue(of([makeRow({ completed: true })] as any));
      component.getVotes();
      expect(component.completed).toBeTrue();
      expect(component.hasSubmitted).toBeTrue();

      // changeVoter re-runs getVotes, so a draft-state voter recomputes it to false.
      pollingServiceSpy.getPollingSummary.and.returnValue(of([makeRow({ completed: false })] as any));
      component.getVotes();
      expect(component.completed).toBeFalse();
      expect(component.hasSubmitted).toBeFalse();
    });

    it('while hasSubmitted is false, auto-save NEVER writes completed:true — even if a row object claims completed (refined safety invariant)', fakeAsync(() => {
      component.hasSubmitted = false;
      const row = makeRow({ candidate_id: 100, vote: 1, completed: true });
      component.onRowChange(row);
      tick(1001);

      expect(pollingServiceSpy.createPollingNotes).toHaveBeenCalledTimes(1);
      const sentBody = pollingServiceSpy.createPollingNotes.calls.mostRecent().args[0] as any[];
      sentBody.forEach(r => expect(r.completed).toBeFalse());
    }));

    it('hasSubmitted=true (loaded-submitted polling): editing keeps the Submitted banner and the flush payload has completed:true for every row', fakeAsync(() => {
      component.hasSubmitted = true;
      component.completed = true;
      const rowA = makeRow({ candidate_id: 100, vote: 1 });
      const rowB = makeRow({ candidate_id: 200, note: 'b' });

      component.onRowChange(rowA);
      component.onRowChange(rowB);
      expect(component.completed).toBeTrue(); // banner does NOT flip back to draft

      tick(1001);
      expect(pollingServiceSpy.createPollingNotes).toHaveBeenCalledTimes(1);
      const sentBody = pollingServiceSpy.createPollingNotes.calls.mostRecent().args[0] as any[];
      expect(sentBody.length).toBe(2);
      sentBody.forEach(r => expect(r.completed).toBeTrue());
    }));

    it('after a successful real submit, a subsequent edit auto-saves with completed:true (amendment stays counted)', fakeAsync(() => {
      spyOn(component.dialog, 'open').and.returnValue({ afterClosed: () => of(true) } as any);
      component.currentPolling = { polling_id: 10 };
      // The post-submit getVotes refresh returns the now-submitted row.
      pollingServiceSpy.getPollingSummary.and.returnValue(of([makeRow({ candidate_id: 100, vote: 1, completed: true })] as any));
      component.dataSourcePS.data = [makeRow({ candidate_id: 100, vote: 1 })];

      component.submitPolling(true); // success fires synchronously via of()
      expect(component.hasSubmitted).toBeTrue();
      expect(pollingServiceSpy.createPollingNotes).toHaveBeenCalledTimes(1);

      // Amend the already-cast vote.
      const edited = component.dataSourcePS.data[0];
      edited.note = 'amended';
      component.onRowChange(edited);
      expect(component.completed).toBeTrue(); // banner stays "Submitted"
      tick(1001);

      expect(pollingServiceSpy.createPollingNotes).toHaveBeenCalledTimes(2);
      const sentBody = pollingServiceSpy.createPollingNotes.calls.mostRecent().args[0] as any[];
      expect(sentBody.length).toBe(1);
      expect(sentBody[0].note).toBe('amended');
      expect(sentBody[0].completed).toBeTrue();
    }));

    it('a draft save success does NOT set hasSubmitted (and a later edit still flips to the draft banner)', () => {
      // Isolate the success handler; the real getVotes refresh would recompute from server rows.
      spyOn(component, 'getVotes');
      component.dataSourcePS.data = [makeRow({ vote: 1 })];

      component.submitPolling(false);
      expect(component.hasSubmitted).toBeFalse();

      component.completed = true;
      component.onRowChange(component.dataSourcePS.data[0]);
      expect(component.completed).toBeFalse();
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
