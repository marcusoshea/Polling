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

@Component({
  selector: 'app-pollings',
  templateUrl: './pollings.component.html',
  styleUrls: ['./pollings.component.css']
})
export class PollingsComponent implements OnInit {
  pollingOrder = {} as PollingOrder;
  public changeAdminOccurred = false;
  public changeAsstOccurred = false;
  private errorMessage = '';
  private accessToken = '';
  public currentPolling: any;
  public startDate: Date;
  public endDate: Date;
  public pollingSummary: any;
  public dataSourcePS = new MatTableDataSource<PollingSummary>();
  public dataSourceNotes = new MatTableDataSource<Note>();
  public dataSourceNotesPolling = new MatTableDataSource<Note>();
  public subscript1?: Subscription;
  public subscript2?: Subscription;
  public subscript3?: Subscription;
  public subscript4?: Subscription;
  public votingMember = 0;

  constructor(private pollingService: PollingService, private memberService: MemberService, private storageService: StorageService, public dialog: MatDialog) { }
  public displayedColumnsPS = ['name', 'note', 'vote', 'private'];
  polling_id: Number;
  polling_name: string;
  start_date: string;
  end_date: string;
  polling_order_id: Number;
  candidate_id: Number;
  polling_candidate_id: Number;
  name: string;
  polling_notes_id: Number;
  note: string;
  vote: Number;
  pn_created_at: string;
  polling_order_member_id: Number;
  isAdmin: boolean = false;
  public completed: boolean = true;
  orderMemberList: OrderMember[] = [];

  async ngOnInit(): Promise<void> {
    const member = await this.storageService.getMember();
    this.pollingOrder = await this.storageService.getPollingOrder();
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
          this.errorMessage = err.error.message;
        }
      });

    this.subscript4 = this.memberService.getAllOrderMembers(this.pollingOrder.polling_order_id, this.accessToken).subscribe({
      next: data => {
        this.orderMemberList = data.filter(e => e.approved === true && e.removed === false);
      },
      error: err => {
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
      },
      error: err => {
        this.errorMessage = err.error.message;
      }
    });
  }

  changeVoter(info) {
    this.votingMember = info.target.value;
    this.getVotes();
  }

  submitPolling(draft: boolean) {
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
            this.errorMessage = err.error.message;
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
  }

}

@Component({
  selector: 'polling-candidate',
  templateUrl: 'polling-candidate.html',
})
export class PollingCandidate {
  public polling: Polling;
  public polling_id: number;
  public displayedColumnsNotes = ['external_note'];
  public dataSourceNotes = new MatTableDataSource<Note>();
  private errorMessage = '';
  public candidateName = '';
  public pollingNames = [];
  public pollingNotes = [];

  constructor(public dialogRef: MatDialogRef<PollingCandidate>, private notesService: NotesService, @Inject(MAT_DIALOG_DATA) public data: any) {
    this.candidateName = this.data.candidate.name;

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
          this.pollingNotes.push(data.filter(e => e.polling_name === element && e.private === false));
        }
        )
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