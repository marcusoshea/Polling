import { Component, OnInit } from '@angular/core';
import { AuthService } from '../_services/auth.service';
import { PollingOrderService } from '../_services/polling-order.service';
import { StorageService } from '../_services/storage.service';

interface PollingOrder {
  polling_order_id: Number;
  polling_order_name: String;
  polling_order_admin: Number;
  polling_order_admin_assistant: Number;
}
 
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
        console.log('this.pollingOrderList', this.pollingOrderList);
        console.log('this.datadatadatadata', response);
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

    this.authService.login(email, password, pollingOrder).subscribe({
      next: data => {
        this.storageService.saveUser(data);

        this.isLoginFailed = false;
        this.isLoggedIn = true;
        this.reloadPage();
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
