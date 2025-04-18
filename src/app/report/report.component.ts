import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { StorageService } from '../services/storage.service';
import { PollingOrder } from '../interfaces/polling-order'
import { PollingService } from '../services/polling.service';
import { NotesService } from '../services/notes.service';
import { Subscription } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker'; 
import { MatNativeDateModule } from '@angular/material/core';
import { MatListModule } from '@angular/material/list';
import { MatExpansionModule } from '@angular/material/expansion';
import { AngularEditorModule } from '@kolkov/angular-editor';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

declare var require: any;

import { trigger } from '@angular/animations';

const htmlToPdfmake = require("html-to-pdfmake");


@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.css'],
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
export class ReportComponent implements OnInit {
  pollingOrder = {} as PollingOrder;
  private errorMessage = '';
  private accessToken = '';
  public pollingReport: any;
  public pollingTotal: any;
  public pollingTitle = '';
  public allPollingNotes: any;
  public pollingOrderParticipation = 0;
  public pollingOrderScore = 0;
  public pollingOrderPollingType = 0;
  public pollingActiveMembers = 0;
  public endDate = '';
  public startDate = '';
  public closedPollingAvailable = true;
  public activeMembers = 0;
  public participatingMembers = 0;
  public participationRate = '';
  public certified = 'not certified.';
  public candidateList = [];
  public isOrderClerk = false;
  public showNotes = true;
  public inProcessPollingAvailable = false;
  public reportShown = false;

  public subscript1?: Subscription;
  public subscript2?: Subscription;
  public subscript3?: Subscription;
  public subscript4?: Subscription;

  constructor(private pollingService: PollingService, private storageService: StorageService, private notesService: NotesService) { }

  async ngOnInit(): Promise<void> {
    const member = await this.storageService.getMember();
    this.pollingOrder = await this.storageService.getPollingOrder();
    this.accessToken = member.access_token;
    this.isOrderClerk = member.isOrderAdmin;
    this.initialReportBuilder();
  }

  public toggleReport() {
    this.reportShown = !this.reportShown;
    this.initialReportBuilder();
  }



  public initialReportBuilder() {
    this.subscript1 = this.pollingService.getPollingReport(this.pollingOrder.polling_order_id, this.accessToken).subscribe({
      next: data => {
        if (data[0]?.end_date === undefined || this.reportShown === true) {
          this.closedPollingAvailable = false;
          this.subscript4 = this.pollingService.getInProcessPollingReport(this.pollingOrder.polling_order_id, this.accessToken).subscribe({
            next: data => {
              if (data[0]?.end_date !== undefined) {
                this.reportBuilder(data);
                this.inProcessPollingAvailable = true;
              }
            },
            error: err => {
              this.errorMessage = err.error.message;
            }
          })
        } else {
          this.closedPollingAvailable = true;
          this.reportBuilder(data);
        }
      },
      error: err => {
        this.errorMessage = err.error.message;
      }

    })
  }

  public reportBuilder(data) {
    this.pollingReport = data;
    this.pollingTitle = this.pollingReport[0].polling_name;
    this.pollingOrderPollingType = this.pollingReport[0].polling_order_polling_type;
    this.pollingOrderParticipation = this.pollingReport[0].polling_order_polling_participation;
    this.pollingOrderScore = this.pollingReport[0].polling_order_polling_score;
    this.endDate = this.pollingReport[0].end_date.split('T')[0];
    this.startDate = this.pollingReport[0].start_date.split('T')[0];
    this.activeMembers = this.pollingReport[1].active_members;
    this.participatingMembers = this.pollingReport[2].member_participation;
    this.participationRate = ((this.participatingMembers / this.activeMembers) * 100).toFixed(2);
    if (((this.participatingMembers / this.activeMembers) * 100) >= this.pollingOrderParticipation) {
      this.certified = 'certified.';
    } else {
      this.certified = 'not certified.';
    }

    this.subscript2 = this.notesService.getAllPollingNotesById(this.pollingReport[0]?.polling_id, this.accessToken).subscribe({
      next: data => { 
        this.subscript3 = this.notesService.getPollingReportTotals(this.pollingReport[0].polling_id, this.accessToken).subscribe({
        next: data => {
        this.pollingTotal = data;
        const key = 'name';
        this.candidateList = [...new Map(data.map(item => [item[key], item])).values()];
        let ticker = 0;
        let positive = 0;
        let negative = 0;
        let abstain = 0;
        let candidateNumber = 0;
        let recommended = '';
        this.candidateList = this.candidateList.sort((a, b) => b.name.localeCompare(a.name))
        this.candidateList.forEach((x) => {
          positive = 0;
          negative = 0;
          abstain = 0;
          ticker = 0;
          this.pollingTotal.forEach((element) => {
            recommended = '';
            if (x.name === element.name) {
              if (element.vote === 'Yes') {
                positive = positive + parseInt(element.total);
              }
              if (element.vote === 'No') {
                negative = negative + parseInt(element.total);
              }
              if (element.vote === 'Wait') {
                negative = negative + parseInt(element.total);
              }
              if (element.vote === 'Abstain' || element.vote === 'Null') {
                abstain = abstain + parseInt(element.total);
              }
            }

            if (this.pollingTotal.length - 1 === ticker) {
              let rating = parseFloat(((positive) / (this.participatingMembers - abstain) * 100).toFixed(2));
              if (rating < 0 || isNaN(rating)) {
                rating = 0;
              }
              if (rating >= this.pollingOrderScore) {
                recommended = 'has been recommended to join the order with a rating of ' + rating + '%'
              } else {
                recommended = 'has NOT been recommended to join the order with a rating of ' + rating + '%'
              }
              this.candidateList[candidateNumber].rating = rating;
              this.candidateList[candidateNumber].recommended = recommended;
              this.candidateList[candidateNumber].inProcessRating = rating + '%';
            } else {
              ticker++;
            }
          })


          if (this.isOrderClerk) {
            this.candidateList[candidateNumber].notes = this.allPollingNotes?.filter(e => e.candidate_id === this.candidateList[candidateNumber].candidate_id && e.note !== null)
          } else {
            this.candidateList[candidateNumber].notes = this.allPollingNotes?.filter(e => e.candidate_id === this.candidateList[candidateNumber].candidate_id && e.private === false && e.note !== null)
          }
          candidateNumber++;
        })

        this.candidateList.sort(function (a, b) {
          return (a.rating > b.rating ? -1 : 1);
        });

      },
      error: err => {
        this.errorMessage = err.error.message;
      }
    });
        this.allPollingNotes = data.filter(e => e.completed === true);
      },
      error: err => {
        this.errorMessage = err.error.message;
      }
    });



  }

  public notesView(): void {
    this.showNotes = !this.showNotes;
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
