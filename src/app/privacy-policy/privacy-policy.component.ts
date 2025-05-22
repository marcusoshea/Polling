import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { PollingOrderService } from '../services/polling-order.service';
import { StorageService } from '../services/storage.service';
import { PollingOrder } from '../interfaces/polling-order'
import { CommonModule } from '@angular/common';  
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-privacy-policy',
  templateUrl: './privacy-policy.component.html',
  imports: [
    FormsModule, 
    CommonModule
  ],
  styleUrls: ['./privacy-policy.component.css']
})
export class PrivacyPolicyComponent implements OnInit {
  form: any = {
    email: null,
    pollingOrder: null
  };
  messageSent = false;

  errorMessage = '';
  pollingOrderList: PollingOrder[] = [];

  constructor(private authService: AuthService, private storageService: StorageService, private pollingOrderService: PollingOrderService) { }

  ngOnInit(): void {

  }
 
}
