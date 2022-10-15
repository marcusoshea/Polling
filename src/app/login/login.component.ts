import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { PollingOrderService } from '../services/polling-order.service';
import { StorageService } from '../services/storage.service';
import { PollingOrder } from '../interfaces/polling-order'
 
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  form: any = {
    email: null,
    password: null,
    pollingOrder: null
  };
  isLoggedIn = false;
  isLoginFailed = false;
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

    if (this.storageService.isLoggedIn()) {
      this.isLoggedIn = true;
    }
  }
 
  onSubmit(): void {
    const { email, password, pollingOrder } = this.form;

    this.authService.login(email, password, pollingOrder.polling_order_id).subscribe({
      next: data => {
        this.storageService.saveMember(data);
        this.storageService.savePollingOrder(pollingOrder);

        this.isLoginFailed = false;
        this.isLoggedIn = true;
        location.replace('/home');
      },
      error: err => {
        this.errorMessage = err.error.message;
        this.isLoginFailed = true;
      }
    });
  }

  reloadPage(): void {
    window.location.reload();
  }
}
