import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { PollingOrderService } from '../services/polling-order.service';
import { StorageService } from '../services/storage.service';
import { PollingOrder } from '../interfaces/polling-order'
 
@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent implements OnInit {
  form: any = {
    email: null,
    pollingOrder: null
  };
  messageSent = false;

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
    const { email, password, pollingOrder } = this.form;

    this.authService.getPasswordToken(email, pollingOrder.polling_order_id).subscribe({
      next: data => {
        this.messageSent = true;

      },
      error: err => {
        this.errorMessage = err.error.message;
        this.messageSent = true;
      }
    });
  }

  reloadPage(): void {
    window.location.reload();
  }
}
