import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { PollingOrderService } from '../services/polling-order.service';
import { StorageService } from '../services/storage.service';
import { PollingOrder } from '../interfaces/polling-order'
import { Subscription } from 'rxjs';
 
@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
  form: any = {
    email: null,
    password: null
  };
  messageSent = false;

  errorMessage = '';
  pollingOrderList: PollingOrder[] = [];
  public subscript1?: Subscription;
  
  constructor(private authService: AuthService, private storageService: StorageService, private pollingOrderService: PollingOrderService) { }

  ngOnInit(): void {
    this.subscript1 = this.pollingOrderService.getAllOrders().subscribe({
      next: response => {
        this.pollingOrderList = response;
      },
      error: err => {

        this.errorMessage = err.error.message;
      }
    });
  }
 
  async onSubmit(): Promise<void> {
    const { email, password } = this.form;

    (await this.authService.resetPassword(email, password)).subscribe({
      next: data => {
        this.messageSent = true;
        location.replace('/login');
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
  
  ngOnDestroy(): void {
    if (this.subscript1) {
      this.subscript1.unsubscribe();
    }
  }

}
