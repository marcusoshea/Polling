import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { PollingService } from '../services/polling.service';
import { Polling } from '../interfaces/polling';
import { StorageService } from '../services/storage.service';
import { PollingOrder } from '../interfaces/polling-order';
import { MatTableDataSource } from '@angular/material/table';
import { PollingSummary } from '../interfaces/polling-summary';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NotesService } from '../services/notes.service';
import { CandidateService } from '../services/candidate.service';
import { Note } from '../interfaces/note';
import { Subscription } from 'rxjs';
import { OrderMember } from '../interfaces/order-member';
import { MemberService } from '../services/member.service';
import { CandidateImages } from '../interfaces/candidateImages';
import { MatSort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker'; 
import { MatNativeDateModule } from '@angular/material/core';
import { MatListModule } from '@angular/material/list';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ToastService } from '../services/toast.service';
import { SubmitReviewDialog } from './submit-review-dialog';
import { CandidateTrendChartComponent } from '../candidate-trend-chart/candidate-trend-chart.component';

@Component({
  selector: 'app-pollings',
  templateUrl: './pollings.component.html',
  imports: [
    MatExpansionModule, 
    MatTableModule, 
    FormsModule, 
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatListModule,
    CommonModule,
    MatSelectModule,
    MatCheckboxModule,
    MatTooltipModule
  ],
  styleUrls: ['./pollings.component.css']
})
export class PollingsComponent implements OnInit {
  pollingOrder = {} as PollingOrder;
  public changeAdminOccurred = false;
  public changeAsstOccurred = false;
  private errorMessage = '';
  private accessToken = '';
  public currentPolling: any;
  public startDate!: Date;
  public endDate!: Date;
  public pollingSummary: any;
  public dataSourcePS = new MatTableDataSource<PollingSummary>();
  public dataSourceNotes = new MatTableDataSource<Note>();
  public dataSourceNotesPolling = new MatTableDataSource<Note>();
  public subscript1?: Subscription;
  public subscript2?: Subscription;
  public subscript3?: Subscription;
  public subscript4?: Subscription;
  public votingMember = 0;
  @ViewChild(MatSort) sort!: MatSort;
  
  constructor(private pollingService: PollingService, private memberService: MemberService, private storageService: StorageService, public dialog: MatDialog, private toastService: ToastService) { }
  public displayedColumnsPS = ['name', 'note', 'vote', 'private'];
  polling_id!: Number;
  polling_name!: string;
  start_date!: string;
  end_date!: string;
  polling_order_id!: Number;
  candidate_id!: Number;
  polling_candidate_id!: Number;
  name!: string;
  polling_notes_id!: Number;
  note!: string;
  vote!: Number;
  pn_created_at!: string;
  polling_order_member_id!: Number;
  isAdmin: boolean = false;
  public completed: boolean = true;
  // §2f "once submitted, always submitted": true once the member's polling loaded
  // fully submitted OR after a successful real submit this session (recomputed by
  // getVotes, which changeVoter also re-runs). While false, auto-save writes
  // completed:false (drafts, never counted); once true, auto-saved edits are
  // amendments to an already-cast vote and stay completed:true.
  public hasSubmitted: boolean = false;
  public isSubmitting: boolean = false;
  orderMemberList: OrderMember[] = [];

  public autoSaveStatus: '' | 'saving' | 'saved' | 'error' = '';
  private autoSaveDirty = new Map<number, PollingSummary>();
  private autoSaveTimer: any;
  private autoSaveFlushInFlight = false;
  private autoSaveFlushSub?: Subscription;
  private autoSaveClearStatusTimer: any;
  private readonly AUTO_SAVE_DEBOUNCE_MS = 1000;
  private readonly AUTO_SAVE_STATUS_CLEAR_MS = 3000;
  // A submit queued to run once an in-flight auto-save flush settles (see autoSaveFlush).
  private pendingSubmit: boolean | null = null;
  // Guards against a second review dialog opening on a double-click.
  public reviewDialogOpen = false;
  // True while getVotes is loading (incl. a proxy-voter switch): block edits so an
  // auto-save can't write the previous voter's stale rows under the new voter.
  public votesLoading = false;

  // Deadline countdown (computed once when the current polling loads).
  public daysRemaining: number | null = null;
  public deadlineText = '';

  // Inline expandable "What do the votes mean?" hint above the voting table.
  public showVoteHelp = false;

  // Progress indicator: rows the member has voted on vs total candidates.
  get votedCount(): number {
    return this.dataSourcePS.data.filter(r => r.vote != null).length;
  }

  get totalCandidates(): number {
    return this.dataSourcePS.data.length;
  }

  // Rows for the mobile card list: the same filtered rows the table shows (respects the
  // candidate filter), sorted by name to match the table's default order. Returns the
  // live row objects so ngModel edits flow through the shared onRowChange/auto-save path.
  get mobileRows(): PollingSummary[] {
    return [...this.dataSourcePS.filteredData].sort((a, b) => a.name.localeCompare(b.name));
  }

  trackByCandidate(_index: number, row: PollingSummary): number {
    return row.candidate_id;
  }

  async ngOnInit(): Promise<void> {
    // Candidate filter matches on candidate name only; the filter string is
    // lowercased in applyFilter. Filtering never mutates dataSourcePS.data.
    this.dataSourcePS.filterPredicate = (row: PollingSummary, filter: string) => row.name.toLowerCase().includes(filter);
    const member = this.storageService.getMember()!;
    this.pollingOrder = this.storageService.getPollingOrder()!;
    this.accessToken = member.access_token;
    this.isAdmin = member.isOrderAdmin;
    this.votingMember = member.memberId,
      this.subscript1 = this.pollingService.getCurrentPolling(this.pollingOrder.polling_order_id, this.accessToken).subscribe({
        next: data => {
          this.currentPolling = data;
          this.startDate = this.currentPolling?.start_date.split('T')[0];
          this.endDate = this.currentPolling?.end_date.split('T')[0];
          if (this.currentPolling?.end_date) {
            this.computeDeadline(this.currentPolling.end_date);
          }
          if (this.currentPolling?.polling_id) {
            this.getVotes();
          }
        },
        error: err => {
          this.toastService.show(err.error?.message ?? 'The current polling could not be loaded. Please try again.');
          this.errorMessage = err.error.message;
        }
      });

    this.subscript4 = this.memberService.getAllOrderMembers(this.pollingOrder.polling_order_id, this.accessToken).subscribe({
      next: data => {
        this.orderMemberList = data.filter(e => e.approved === true && e.removed === false);
      },
      error: err => {
        this.toastService.show(err.error?.message ?? 'The order member list could not be loaded. Please try again.');
        this.errorMessage = err.error.message;
      }
    });

  }

  getVotes() {
    // Cancel any prior in-flight load so a slow earlier response can't land last
    // (matters on rapid proxy-voter switches).
    if (this.subscript2) {
      this.subscript2.unsubscribe();
    }
    this.votesLoading = true;
    this.subscript2 = this.pollingService.getPollingSummary(this.currentPolling?.polling_id, this.votingMember.toString(), this.accessToken).subscribe({
      next: data => {
        this.pollingSummary = data;
        this.dataSourcePS.data = data;
        if (data.filter(e => e.completed === false).length > 0) {
          this.completed = false;
        } else {
          this.completed = true;
        };
        // §2f: a fully-submitted load means this member has already cast their vote.
        this.hasSubmitted = this.completed;
        this.dataSourcePS.sort = this.sort;
        this.votesLoading = false;
      },
      error: err => {
        this.votesLoading = false;
        this.toastService.show(err.error?.message ?? 'Your votes could not be loaded. Please try again.');
        this.errorMessage = err.error.message;
      }
    });
  }

  // Same math as the admin dashboard tile: ceil of (end - now) in days.
  private computeDeadline(endDate: string): void {
    const end = new Date(endDate).getTime();
    const today = new Date().getTime();
    this.daysRemaining = Math.ceil((end - today) / 86400000);
    if (this.daysRemaining === 0) {
      this.deadlineText = '— closes today';
    } else if (this.daysRemaining < 0) {
      this.deadlineText = '— closing';
    } else {
      this.deadlineText = `— closes in ${this.daysRemaining} days`;
    }
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSourcePS.filter = filterValue.trim().toLowerCase();
  }

  changeVoter(info: Event) {
    // Clear all pending auto-save work so nothing stale fires against the newly selected voter.
    this.clearAutoSaveState();
    this.pendingSubmit = null;
    this.votingMember = parseInt((info.target as HTMLInputElement).value);
    // Reset per-voter state SYNCHRONOUSLY and drop the old voter's rows so an edit
    // during the load window can't be auto-saved against the new voter (getVotes
    // recomputes these when the new voter's summary arrives).
    this.hasSubmitted = false;
    this.completed = true;
    this.dataSourcePS.data = [];
    this.getVotes();
  }

  onRowChange(element: PollingSummary): void {
    // Block edits while a submit is running or the (new) voter's rows are still loading
    // — otherwise an auto-save could write stale rows under the wrong voter.
    if (this.isSubmitting || this.votesLoading) {
      return;
    }
    // Skip entirely-empty rows.
    if (!(element.vote != null || (element.note && element.note.trim().length > 0))) {
      return;
    }
    // Before first submission, any auto-saved edit is unsubmitted work: honestly flip the
    // banner to the draft state (rows will be written completed:false; "Submitted ✓" would
    // be misleading). Once submitted (§2f), edits are amendments to an already-cast vote
    // (written completed:true) — the banner stays "Submitted".
    if (!this.hasSubmitted) {
      this.completed = false;
    }
    // Upsert into the shared dirty map (re-edits overwrite with the freshest row reference)
    // and re-arm the single debounce timer: one flush fires 1s after the LAST edit anywhere.
    this.autoSaveDirty.set(element.candidate_id, element);
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
    }
    this.autoSaveTimer = setTimeout(() => {
      this.autoSaveTimer = null;
      this.autoSaveFlush();
    }, this.AUTO_SAVE_DEBOUNCE_MS);
  }

  autoSaveFlush(): void {
    // Never overlap requests: if a flush is already in flight, defer by re-arming the timer.
    if (this.autoSaveFlushInFlight) {
      if (this.autoSaveTimer) {
        clearTimeout(this.autoSaveTimer);
      }
      this.autoSaveTimer = setTimeout(() => {
        this.autoSaveTimer = null;
        this.autoSaveFlush();
      }, this.AUTO_SAVE_DEBOUNCE_MS);
      return;
    }
    if (this.autoSaveDirty.size === 0) {
      return;
    }
    // Snapshot the live row references, then send submission-aware copies (§2f):
    // completed:false while the member has never submitted (drafts — a never-submitted
    // member can only become counted by clicking Submit), completed:true after a
    // submit (amendments to an already-cast vote remain counted in reports).
    const snapshot = [...this.autoSaveDirty.values()];
    const rows = snapshot.map(r => ({ ...r, completed: this.hasSubmitted }));
    this.autoSaveDirty.clear();
    this.autoSaveFlushInFlight = true;
    this.autoSaveStatus = 'saving';
    if (this.autoSaveClearStatusTimer) {
      clearTimeout(this.autoSaveClearStatusTimer);
      this.autoSaveClearStatusTimer = null;
    }
    this.autoSaveFlushSub = this.pollingService.createPollingNotes(rows, this.accessToken, this.votingMember).subscribe({
      next: () => {
        this.autoSaveFlushInFlight = false;
        this.autoSaveFlushSub = undefined;
        // A submit queued while this flush was in flight must run NOW (after the flush
        // committed) so the authoritative completed:true write lands last — otherwise a
        // late flush could un-submit the vote server-side.
        if (this.runQueuedSubmit()) {
          return;
        }
        this.autoSaveStatus = 'saved';
        this.autoSaveClearStatusTimer = setTimeout(() => {
          if (this.autoSaveStatus === 'saved') {
            this.autoSaveStatus = '';
          }
          this.autoSaveClearStatusTimer = null;
        }, this.AUTO_SAVE_STATUS_CLEAR_MS);
      },
      error: () => {
        this.autoSaveFlushInFlight = false;
        this.autoSaveFlushSub = undefined;
        // The submit sends ALL rows authoritatively, so run it even if the flush failed.
        if (this.runQueuedSubmit()) {
          return;
        }
        this.autoSaveStatus = 'error';
        // Merge the failed rows back into the dirty map so the next edit retries them,
        // WITHOUT clobbering rows re-edited while the flush was in flight.
        // Merge the live row references (not the completed:false copies).
        snapshot.forEach(r => {
          if (!this.autoSaveDirty.has(r.candidate_id)) {
            this.autoSaveDirty.set(r.candidate_id, r);
          }
        });
      }
    });
  }

  // If a submit was queued behind an in-flight flush, run it now. Returns true if it ran.
  private runQueuedSubmit(): boolean {
    if (this.pendingSubmit === null) {
      return false;
    }
    const submit = this.pendingSubmit;
    this.pendingSubmit = null;
    this.executeSubmit(submit);
    return true;
  }

  private clearAutoSaveState(): void {
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
    this.autoSaveDirty.clear();
    if (this.autoSaveFlushSub) {
      this.autoSaveFlushSub.unsubscribe();
      this.autoSaveFlushSub = undefined;
    }
    this.autoSaveFlushInFlight = false;
    // Reset the status line — its observer callbacks (the only place it clears) will
    // never fire after we've unsubscribed the flush above.
    this.autoSaveStatus = '';
    if (this.autoSaveClearStatusTimer) {
      clearTimeout(this.autoSaveClearStatusTimer);
      this.autoSaveClearStatusTimer = null;
    }
  }

  // NOTE: the `draft` parameter name is historical and inverted-looking:
  //   draft === true  -> REAL submit (rows are written completed:true)
  //   draft === false -> Save Draft (rows are written completed:false)
  // Behavior is preserved exactly; the template's two call sites rely on it.
  submitPolling(draft: boolean) {
    if (this.isSubmitting || this.reviewDialogOpen) {
      return; // Prevent double submission / a second review dialog on double-click.
    }
    if (!draft) {
      // Save Draft: post immediately, no confirmation needed.
      this.doSubmitPolling(false);
      return;
    }
    // Real submit: show the review/confirm dialog first; only proceed on Confirm.
    this.reviewDialogOpen = true;
    const dialogRef = this.dialog.open(SubmitReviewDialog, {
      panelClass: 'custom-dialog-container',
      data: { rows: this.dataSourcePS.data }
    });
    dialogRef.afterClosed().subscribe(confirmed => {
      this.reviewDialogOpen = false;
      if (confirmed === true) {
        this.doSubmitPolling(true);
      }
    });
  }

  private doSubmitPolling(submit: boolean) {
    if (this.isSubmitting) {
      return; // Prevent double submission
    }
    this.isSubmitting = true;
    // Stop any NEW auto-save from scheduling. Do NOT abandon an in-flight flush — its
    // POST may already be committing server-side; unsubscribing only aborts the client,
    // so a late flush (completed:false) could land AFTER our submit and un-submit the
    // vote. Instead, queue the submit to run once the flush settles (runQueuedSubmit).
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
    this.autoSaveDirty.clear();
    if (this.autoSaveFlushInFlight) {
      this.pendingSubmit = submit;
      return;
    }
    this.executeSubmit(submit);
  }

  private executeSubmit(submit: boolean): void {
    this.isSubmitting = true;
    // Clear any stale auto-save status now that we're doing an authoritative write.
    this.autoSaveStatus = '';
    if (this.autoSaveClearStatusTimer) {
      clearTimeout(this.autoSaveClearStatusTimer);
      this.autoSaveClearStatusTimer = null;
    }
    const rows = this.dataSourcePS.data;
    if (rows.length === 0) {
      // No candidates to submit (the create endpoint stamps auth onto body[0]).
      this.isSubmitting = false;
      return;
    }
    rows.forEach(x => x.completed = submit);
    this.subscript3 = this.pollingService.createPollingNotes(rows, this.accessToken, this.votingMember).subscribe({
      next: () => {
        if (submit) {
          // §2f: mark the vote as cast immediately so edits made before the
          // getVotes refresh returns are already treated as amendments
          // (auto-saved with completed:true). Draft saves must NOT set this.
          this.hasSubmitted = true;
        }
        // Reflect the submitted/draft state immediately so the banner/buttons don't
        // briefly show the old state (and can't be used to un-submit) before getVotes.
        this.completed = submit;
        this.toastService.show(
          submit
            ? 'Your polling vote has been submitted.'
            : 'Draft saved — your vote is NOT submitted yet.',
          'success'
        );
        // Refresh rows and the submitted/draft banner in place (no reload).
        this.getVotes();
        this.isSubmitting = false;
      },
      error: err => {
        this.toastService.show(err.error?.message ?? 'Your vote could not be submitted. Please try again.');
        this.errorMessage = err.error?.message;
        this.isSubmitting = false; // Re-enable buttons on error
      }
    });
  }

  viewCandidate(enterAnimationDuration: string, exitAnimationDuration: string, element: any): void {
    const dialogRef = this.dialog.open(PollingCandidate, {
      panelClass: 'custom-dialog-container',
      // Reasonable reading width for the trend chart + notes: near-full on phones,
      // capped so it doesn't stretch edge-to-edge on large screens.
      width: '90vw',
      maxWidth: '900px',
      enterAnimationDuration,
      exitAnimationDuration,
      data: {
        "candidate": element,
        "accessToken": this.accessToken
      },
    });
  }

  ngOnDestroy(): void {
    if (this.subscript1) {
      this.subscript1.unsubscribe();
    }
    if (this.subscript2) {
      this.subscript2.unsubscribe();
    }
    if (this.subscript3) {
      this.subscript3.unsubscribe();
    }
    if (this.subscript4) {
      this.subscript4.unsubscribe();
    }
    this.clearAutoSaveState();
    if (this.autoSaveClearStatusTimer) {
      clearTimeout(this.autoSaveClearStatusTimer);
      this.autoSaveClearStatusTimer = null;
    }
  }

}


@Component({
  selector: 'polling-candidate',
  templateUrl: 'polling-candidate.html',  
  imports: [
    MatExpansionModule, 
    MatTableModule, 
    FormsModule, 
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatListModule,
    MatDialogModule,
    FormsModule,
    CommonModule,
    CandidateTrendChartComponent
  ],
})
export class PollingCandidate {
  public polling!: Polling;
  public polling_id!: number;
  public displayedColumnsNotes = ['external_note'];
  public dataSourceNotes = new MatTableDataSource<Note>();
  private errorMessage = '';
  public candidateName = '';
  public candidateLink = '';
  public candidateId!: number;
  public accessToken = '';
  public pollingNames = [];
  public pollingNotes = [];
  public myPollingNames: any[] = [];
  public myPollingNotes: any[] = [];
  public displayedColumnsCandidateImage = ['image','description'];
  public dataSourceCandidateImages = new MatTableDataSource<CandidateImages>();
  candidateImageList: CandidateImages[] = [];

  constructor(public dialogRef: MatDialogRef<PollingCandidate>, private notesService: NotesService, private candidateService: CandidateService,  @Inject(MAT_DIALOG_DATA) public data: any) {
    this.candidateName = this.data.candidate.name;
    this.candidateLink = this.data.candidate.link;
    this.candidateId = this.data.candidate.candidate_id;
    this.accessToken = this.data.accessToken;
    this.notesService.getExternalNoteByCandidateId(data.candidate.candidate_id, data.accessToken).subscribe({
      next: data => {
        this.dataSourceNotes.data = data;
      },
      error: err => {
        this.errorMessage = err.error.message;
      }
    });

    this.notesService.getPollingNoteByCandidateId(data.candidate.candidate_id, data.accessToken).subscribe({
      next: data => {
        //get unique polling names
        this.pollingNames = [...new Set(data.sort((a, b) => (a.end_date > b.end_date ? -1 : 1)).map(item => item.polling_name))];
        this.pollingNames.forEach((element, index) => {
          this.pollingNotes.push(data.filter(e => e.polling_name === element));
        }
        )
      },
      error: err => {
        this.errorMessage = err.error.message;
      }
    });

    this.notesService.getMyPollingNotesByCandidateId(data.candidate.candidate_id, data.accessToken).subscribe({
      next: data => {
        const notes = data ?? [];
        //get unique polling names
        this.myPollingNames = [...new Set(notes.sort((a, b) => (a.end_date > b.end_date ? -1 : 1)).map(item => item.polling_name))];
        this.myPollingNames.forEach((element, index) => {
          this.myPollingNotes.push(notes.filter(e => e.polling_name === element));
        }
        )
      },
      error: err => {
        this.errorMessage = err.error.message;
      }
    });

    this.candidateService.getAllCandidateImages(data.candidate.candidate_id, data.accessToken).subscribe({
      next: data => {
        this.candidateImageList = data;
        this.dataSourceCandidateImages.data = data;
      },
      error: err => {
        this.errorMessage = err.error.message;
      }
    });

  }

  returnToPolling(): void {
    this.dialogRef.close();
  }

}