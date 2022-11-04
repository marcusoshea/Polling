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

  constructor(private pollingService: PollingService, private storageService: StorageService, public dialog: MatDialog) { }
  public displayedColumnsPS = ['name', 'note', 'vote'];
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
  public completed: boolean = true;

    async ngOnInit(): Promise<void> {
    const member = await this.storageService.getMember();
    this.pollingOrder = await this.storageService.getPollingOrder();

    this.accessToken = member.access_token;
    this.subscript1 = this.pollingService.getCurrentPolling(this.pollingOrder.polling_order_id, this.accessToken).subscribe({
      next: data => {
        this.currentPolling = data;
        this.startDate = this.currentPolling?.start_date.split('T')[0];
        this.endDate = this.currentPolling?.end_date.split('T')[0];
        if (this.currentPolling?.polling_id) {
          this.subscript2 = this.pollingService.getPollingSummary(this.currentPolling?.polling_id, member.memberId, this.accessToken).subscribe({
            next: data => {
              this.pollingSummary = data;
              this.dataSourcePS.data = data;
              if (data.filter(e => e.completed === false).length > 0){
                this.completed = false;
              };
            },
            error: err => {
              this.errorMessage = err.error.message;
            }
          });
        }

      },
      error: err => {
        this.errorMessage = err.error.message;
      }
    });

  }

  submitPolling(draft: boolean) {
    let finished = 0;
    this.dataSourcePS.data.forEach(x => {
      x.completed = draft;
      finished++;
      if (finished === this.dataSourcePS.data.length) {
        this.subscript3 = this.pollingService.createPollingNotes(this.dataSourcePS.data, this.accessToken).subscribe({
          next: data => {
            if(draft) {
              alert("Polling Submitted");
              setTimeout(() => {
                window.location.reload();
              }, 1000); 
            } else {
              alert("Daft Saved, Polling NOT submitted");
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
  public dataSourceNotesPolling = new MatTableDataSource<Note>();
  private errorMessage = '';
  public candidateName = '';

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
        this.dataSourceNotesPolling.data = data;
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