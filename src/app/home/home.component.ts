import { Component, OnInit } from '@angular/core';
import { StorageService } from '../services/storage.service';
import { PollingOrder } from '../interfaces/polling-order'
import { RouterModule, ActivatedRoute, RouterOutlet  } from '@angular/router';
import { provideRouter } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  imports: [RouterModule],
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {


  pollingOrder = {} as PollingOrder;

  constructor( private storageService: StorageService, private activatedRoute: ActivatedRoute) { }

  ngOnInit(): void {
        this.pollingOrder = this.storageService.getPollingOrder();
  }

}
