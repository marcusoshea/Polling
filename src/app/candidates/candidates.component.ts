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
  private errorMessage = '';
  noteList: any[];

  constructor(private candidateService: CandidateService, private storageService: StorageService, private notesService:NotesService) { }
  private accessToken = '';
  public dataSourceCandidates = new MatTableDataSource<Candidate>();
  public displayedColumnsCandidates = ['name'];
  public displayedColumnsNotes = ['external_note'];
  public dataSourceNotes = new MatTableDataSource<Note>();


  async ngOnInit(): Promise<void> {
    const member = await this.storageService.getMember();
    this.pollingOrder = await this.storageService.getPollingOrder();
    this.accessToken = member.access_token;
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

  viewCandidate(element: any) {
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

    this.candidateSelected = true;
    console.log(element);
  }
}