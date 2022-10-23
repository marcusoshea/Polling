import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MemberService } from '../services/member.service';
import { StorageService } from '../services/storage.service';
import { PollingOrderService } from '../services/polling-order.service';
import { Router } from '@angular/router';
import { PollingOrder } from '../interfaces/polling-order'
import { OrderMember } from '../interfaces/order-member'
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { Candidate } from '../interfaces/candidate';
import { Note } from '../interfaces/note';
import { CandidateService } from '../services/candidate.service';
import { NotesService } from '../services/notes.service';


@Component({
  selector: 'app-candidates',
  templateUrl: './candidates.component.html',
  styleUrls: ['./candidates.component.css']
})
export class CandidatesComponent implements OnInit {
  pollingOrder = {} as PollingOrder;
  orderMemberList: OrderMember[] = [];
  UnapprovedOrderMemberList: OrderMember[] = [];
  candidateList: Candidate[] = [];
  candidateSelected = false;
  candidateName = '';
  private errorMessage = '';
  noteList: any[];
  noteListPolling: any[];
  newExternalNote = '';
  candidate_id = 0;

  constructor(private candidateService: CandidateService, private storageService: StorageService, private notesService: NotesService) { }
  private accessToken = '';
  private memberId = '';
  public dataSourceCandidates = new MatTableDataSource<Candidate>();
  public displayedColumnsCandidates = ['name'];
  public displayedColumnsNotes = ['external_note'];
  public dataSourceNotes = new MatTableDataSource<Note>();
  public dataSourceNotesPolling = new MatTableDataSource<Note>();

  


  async ngOnInit(): Promise<void> {
    const member = await this.storageService.getMember();
    this.pollingOrder = await this.storageService.getPollingOrder();
    this.accessToken = member.access_token;
    this.memberId = member.memberId;
    this.candidateService.getAllCandidates(this.pollingOrder.polling_order_id, this.accessToken).subscribe({
      next: data => {
        this.candidateList = data;
        this.dataSourceCandidates.data = data;
      },
      error: err => {
        this.errorMessage = err.error.message;
      }
    });
  }

  resetCandidates():void {
    this.candidateSelected = false;
    this.candidateName = '';
    this.candidate_id = 0;
  }



  viewCandidate(element: any):void {
    this.candidateName = element.name;
    this.candidate_id = element.candidate_id;
    console.log('element', element);
    this.notesService.getExternalNoteByCandidateId(element.candidate_id, this.accessToken).subscribe({
      next: data => {
        console.log('data', data);
        this.noteList = data;
        this.dataSourceNotes.data = data;
      },
      error: err => {
        this.errorMessage = err.error.message;
      }
    });

    this.notesService.gePollingNoteByCandidateId(element.candidate_id, this.accessToken).subscribe({
      next: data => {
        console.log('data', data);
        this.noteListPolling = data;
        this.dataSourceNotesPolling.data = data;
      },
      error: err => {
        this.errorMessage = err.error.message;
      }
    });

    this.candidateSelected = true;
    console.log(element);
  }

  public async addExternalNote():Promise<void> {
   const element = {
      "name":this.candidateName,
      "candidate_id": this.candidate_id
    }
    this.notesService.createExternalNote(this.newExternalNote, this.candidate_id.toString(),
      this.memberId, this.accessToken).subscribe({
        next: () => {
         this.viewCandidate(element);
        },
        error: err => {
          this.errorMessage = err.error.message;
        }

      })
  }
}  
