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
import { ToastService } from '../services/toast.service';

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
    MatCheckboxModule
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

  async ngOnInit(): Promise<void> {
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
    this.subscript2 = this.pollingService.getPollingSummary(this.currentPolling?.polling_id, this.votingMember.toString(), this.accessToken).subscribe({
      next: data => {
        this.pollingSummary = data;
        this.dataSourcePS.data = data;
        if (data.filter(e => e.completed === false).length > 0) {
          this.completed = false;
        } else {
          this.completed = true;
        };    
        this.dataSourcePS.sort = this.sort;
      },
      error: err => {
        this.toastService.show(err.error?.message ?? 'Your votes could not be loaded. Please try again.');
        this.errorMessage = err.error.message;
      }
    });
  }

  changeVoter(info: Event) {
    // Clear all pending auto-save work so nothing stale fires against the newly selected voter.
    this.clearAutoSaveState();
    this.votingMember = parseInt((info.target as HTMLInputElement).value);
    this.getVotes();
  }

  onRowChange(element: PollingSummary): void {
    if (this.isSubmitting) {
      return;
    }
    // Skip entirely-empty rows.
    if (!(element.vote != null || (element.note && element.note.trim().length > 0))) {
      return;
    }
    // Any auto-saved edit is unsubmitted work, so honestly flip the banner to the draft state immediately.
    // The row will be written as completed:false, so "Submitted ✓" would otherwise be misleading. Only Submit re-sets completed=true.
    this.completed = false;
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
    // Snapshot the live row references, then send copies with completed:false
    // (same payload shape as Save Draft; the endpoint accepts an array of any length).
    const snapshot = [...this.autoSaveDirty.values()];
    const rows = snapshot.map(r => ({ ...r, completed: false }));
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
  }

  submitPolling(draft: boolean) {
    if (this.isSubmitting) {
      return; // Prevent double submission
    }
    
    this.isSubmitting = true;
    let finished = 0;
    this.dataSourcePS.data.forEach(x => {
      x.completed = draft;
      finished++;
      if (finished === this.dataSourcePS.data.length) {
        this.subscript3 = this.pollingService.createPollingNotes(this.dataSourcePS.data, this.accessToken, this.votingMember).subscribe({
          next: data => {
            if (draft) {
              alert("Polling Submitted");
              setTimeout(() => {
                window.location.reload();
              }, 1000);
            } else {
              alert("Draft Saved, Polling NOT submitted");
              setTimeout(() => {
                window.location.reload();
              }, 1000);
            }
          },
          error: err => {
            this.toastService.show(err.error?.message ?? 'Your vote could not be submitted. Please try again.');
            this.errorMessage = err.error?.message;
            this.isSubmitting = false; // Re-enable buttons on error
          }
        });
      }
    })

  }

  viewCandidate(enterAnimationDuration: string, exitAnimationDuration: string, element: any): void {
    const dialogRef = this.dialog.open(PollingCandidate, {
      panelClass: 'custom-dialog-container',
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
    CommonModule
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