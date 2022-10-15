import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { PollingOrderService } from '../services/polling-order.service';
import { StorageService } from '../services/storage.service';
import { PollingOrder } from '../interfaces/polling-order'

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  form: any = {
    name: null,
    email: null,
    password: null,
    pollingOrder: null
  };
  isRegistered = false;
  errorMessage = '';
  pollingOrderList: PollingOrder[] = [];

  constructor(private authService: AuthService, private storageService: StorageService, private pollingOrderService: PollingOrderService) { }

  ngOnInit(): void {
    this.pollingOrderService.getAllOrders().subscribe({
      next: response => {
        this.pollingOrderList = response;
      },
      error: err => {

        this.errorMessage = err.error.message;
      }
    });
  }
  
  onSubmit(): void {
    const { name, email, password, pollingOrder } = this.form;
    this.authService.register(name, email, password, pollingOrder.polling_order_id).subscribe({
      next: data => {
        this.isRegistered = true;
      },
      error: err => {
        this.errorMessage = err.error.message;
      }
    }); 
  }

}
