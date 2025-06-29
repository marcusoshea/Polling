import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MemberService } from '../services/member.service';
import { StorageService } from '../services/storage.service';
import { PollingOrderService } from '../services/polling-order.service';
import { Router, RouterModule } from '@angular/router';
import { PollingOrder } from '../interfaces/polling-order'
import { OrderMember } from '../interfaces/order-member'
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormsModule, Validators } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Candidate } from '../interfaces/candidate';
import { Note } from '../interfaces/note';
import { CandidateService } from '../services/candidate.service';
import { NotesService } from '../services/notes.service';
import { Subscription } from 'rxjs';
import { CandidateImages } from '../interfaces/candidateImages';
import { CommonModule } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatListModule } from '@angular/material/list';
import { AngularEditorModule } from '@kolkov/angular-editor';


@Component({
  selector: 'app-candidates',
  templateUrl: './candidates.component.html',
  styleUrls: ['./candidates.component.css'],
  imports: [
    MatExpansionModule, 
    MatTableModule, 
    FormsModule, 
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatListModule,
    AngularEditorModule,
    RouterModule,
    CommonModule,
  ],
})
export class CandidatesComponent implements OnInit {
  pollingOrder = {} as PollingOrder;
  orderMemberList: OrderMember[] = [];
  UnapprovedOrderMemberList: OrderMember[] = [];
  candidateList: Candidate[] = [];
  candidateSelected = false;
  candidateName = '';
  candidateLink = '';
  private errorMessage = '';
  noteList: any[];
  noteListPolling: any[];
  newExternalNote = '';
  candidate_id = 0;
  watch_list = false;
  filterValue = '';
  public subscript1?: Subscription;
  public subscript2?: Subscription;
  public subscript3?: Subscription;
  public subscript4?: Subscription;
  public subscript5?: Subscription;
  public subscript6?: Subscription;

  constructor(private candidateService: CandidateService, private storageService: StorageService, private notesService: NotesService) { }
  private accessToken = '';
  private memberId = '';
  public dataSourceCandidates = new MatTableDataSource<Candidate>();
  public displayedColumnsCandidates = ['name', 'watch_list'];
  public displayedColumnsNotes = ['external_note'];
  public dataSourceNotes = new MatTableDataSource<Note>();
  public pollingNames = [];
  public pollingNotes = [];
  public displayedColumnsCandidateImage = ['image','description'];
  public dataSourceCandidateImages = new MatTableDataSource<CandidateImages>();
  candidateImageList: CandidateImages[] = [];

  async ngOnInit(): Promise<void> {
    const member = await this.storageService.getMember();
    this.pollingOrder = await this.storageService.getPollingOrder();
    this.accessToken = member.access_token;
    this.memberId = member.memberId;
    this.subscript1 = this.candidateService.getAllCandidates(this.pollingOrder.polling_order_id, this.accessToken).subscribe({
      next: data => {
        this.candidateList = data;
        this.dataSourceCandidates.data = data;
      },
      error: err => {
        this.errorMessage = err.error.message;
      }
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSourceCandidates.filter = filterValue.trim().toLowerCase();
  }

  resetCandidates(): void {
    this.candidateSelected = false;
    this.candidateName = '';
    this.candidate_id = 0;
    this.pollingNames = [];
    this.pollingNotes = [];
  }

  viewCandidate(element: any): void {
    this.candidateName = element.name;
    this.candidateLink = element.link;
    this.candidate_id = element.candidate_id;
    this.watch_list = element.watch_list;
    this.pollingNames = [];
    this.pollingNotes = [];
    this.subscript2 = this.notesService.getExternalNoteByCandidateId(element.candidate_id, this.accessToken).subscribe({
      next: data => {
        this.noteList = data;
        this.dataSourceNotes.data = data;
      },
      error: err => {
        this.errorMessage = err.error.message;
      }
    });

    this.subscript3 = this.notesService.getPollingNoteByCandidateId(element.candidate_id, this.accessToken).subscribe({
      next: data => {
        //get unique polling names
        this.pollingNames = [...new Set(data.map(item => item.polling_name))];
        this.pollingNames.forEach((element, index) => {
          this.pollingNotes.push(data.filter(e => e.polling_name === element && e.private === false));
        }
        )
      },
      error: err => {
        this.errorMessage = err.error.message;
      }
    });

    this.subscript6 = this.candidateService.getAllCandidateImages(element.candidate_id, this.accessToken).subscribe({
      next: data => {
        this.candidateImageList = data;
        this.dataSourceCandidateImages.data = data;
      },
      error: err => {
        this.errorMessage = err.error.message;
      }
    });
    this.candidateSelected = true;
  }

  public async addExternalNote(): Promise<void> {
    const element = {
      "name": this.candidateName,
      "candidate_id": this.candidate_id
    }
    this.subscript4 = this.notesService.createExternalNote(this.newExternalNote, this.candidate_id.toString(),
      this.memberId, this.accessToken).subscribe({
        next: () => {
          this.viewCandidate(element);
        },
        error: err => {
          this.errorMessage = err.error.message;
        }

      });
  }

  public async removeExternalNote(element: any): Promise<void> {
    this.subscript5 = this.notesService.removeExternalNote(element.external_notes_id, this.memberId, this.accessToken).subscribe({
      next: () => {
        this.viewCandidate(element);
      },
      error: err => {
        this.errorMessage = err.error.message;
      }
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
    if (this.subscript5) {
      this.subscript5.unsubscribe();
    }
    if (this.subscript6) {
      this.subscript6.unsubscribe();
    }
  }
}  
