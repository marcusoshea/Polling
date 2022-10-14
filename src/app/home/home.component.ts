import { Component, OnInit } from '@angular/core';
import { StorageService } from '../services/storage.service';
import { PollingOrder } from '../interfaces/polling-order'

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {


  pollingOrder = {} as PollingOrder;

  constructor( private storageService: StorageService) { }

  ngOnInit(): void {
        this.pollingOrder = this.storageService.getPollingOrder();
  }

}
