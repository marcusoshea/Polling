import { Component, OnInit } from '@angular/core';
import { StorageService } from '../services/storage.service';
import { PollingOrder } from '../interfaces/polling-order'
import { PollingService } from '../services/polling.service';
import { NotesService } from '../services/notes.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.css']
})
export class ReportComponent implements OnInit {
  pollingOrder = {} as PollingOrder;
  private errorMessage = '';
  private accessToken = '';
  public pollingReport: any;
  public pollingTotal: any;
  public pollingTitle = '';
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

  public subscript1?: Subscription;
  public subscript2?: Subscription;

  constructor(private pollingService: PollingService, private storageService: StorageService, private notesService: NotesService) { }

  async ngOnInit(): Promise<void> {
    const member = await this.storageService.getMember();
    this.pollingOrder = await this.storageService.getPollingOrder();
    this.accessToken = member.access_token;

    this.subscript1 = this.pollingService.getPollingReport(this.pollingOrder.polling_order_id, this.accessToken).subscribe({
      next: data => {
        if (data.length > 0) {
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
          if (((this.participatingMembers / this.activeMembers) * 100) >= this.pollingOrderScore) {
            this.certified = 'certified.';
          }

          this.subscript2 = this.notesService.getPollingReportTotals(this.pollingReport[0].polling_id, this.accessToken).subscribe({
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

              this.candidateList.forEach((x) => {
                positive = 0;
                negative = 0;
                this.pollingTotal.forEach((element) => {
                  ticker++;
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
                    if (element.vote === 'Abstain') {
                      abstain = abstain + parseInt(element.total);
                    }
                  }
                  if (this.pollingTotal.length === ticker) {
                    let rating = (positive - negative) / (this.participatingMembers - abstain) * 100;
                    if (rating < 0) {
                      rating = 0;
                    }
                    if (rating >= this.pollingOrderScore) {
                      recommended = 'has been recommended to join the order with a rating of ' + rating + '%'
                    } else {
                      recommended = 'has NOT been recommended to join the order with a rating of ' + rating + '%'
                    }
                    ticker = 0;
                    this.candidateList[candidateNumber].rating = rating;
                    this.candidateList[candidateNumber].recommended = recommended;
                    this.candidateList.sort(x => x.rating).reverse();
                  }
                })
                recommended = '';
                candidateNumber++;
              })
            },
            error: err => {
              this.errorMessage = err.error.message;
            }
          });

        } else {
          this.closedPollingAvailable = false;
        }
      },
      error: err => {
        this.errorMessage = err.error.message;
      }
    })
  }

  ngOnDestroy(): void {
    if (this.subscript1) {
      this.subscript1.unsubscribe();
    }
    if (this.subscript2) {
      this.subscript2.unsubscribe();
    }
  }


}
