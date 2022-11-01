import { Component, OnInit } from '@angular/core';
import { PollingService } from '../services/polling.service';
import { Polling } from '../interfaces/polling';
import { StorageService } from '../services/storage.service';
import { PollingOrder } from '../interfaces/polling-order';

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

  constructor(private pollingService: PollingService, private storageService: StorageService) { }

  async ngOnInit(): Promise<void> {
    const member = await this.storageService.getMember();
    this.pollingOrder = await this.storageService.getPollingOrder();

    this.accessToken = member.access_token;
    this.pollingService.getCurrentPolling(this.pollingOrder.polling_order_id, this.accessToken).subscribe({
      next: data => {
        this.currentPolling = data;
        this.startDate = this.currentPolling?.start_date.split('T')[0];
        this.endDate = this.currentPolling?.end_date.split('T')[0];
        if (this.currentPolling?.polling_id) {
          this.pollingService.getPollingSummary(this.currentPolling?.polling_id, member.memberId, this.accessToken).subscribe({
            next: data => {
              this.pollingSummary = data;
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

}  
