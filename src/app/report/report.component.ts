import { Component, OnInit } from '@angular/core';
import { StorageService } from '../services/storage.service';
import { PollingOrder } from '../interfaces/polling-order'

@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.css']
})
export class ReportComponent implements OnInit {


  pollingOrder = {} as PollingOrder;

  constructor( private storageService: StorageService) { }

  ngOnInit(): void {
        this.pollingOrder = this.storageService.getPollingOrder();
  }

}
