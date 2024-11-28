import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { PollingOrderService } from '../services/polling-order.service';
import { StorageService } from '../services/storage.service';
import { PollingOrder } from '../interfaces/polling-order'
import { Subscription } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker'; 
import { MatNativeDateModule } from '@angular/material/core';
import { MatListModule } from '@angular/material/list';
import { MatExpansionModule } from '@angular/material/expansion';
import { AngularEditorModule } from '@kolkov/angular-editor';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  imports: [
    MatExpansionModule, 
    MatTableModule, 
    FormsModule, 
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatListModule,
    AngularEditorModule,
    RouterModule
  ],
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
  public subscript1?: Subscription;
  public subscript2?: Subscription;

  constructor(private authService: AuthService, private storageService: StorageService, private pollingOrderService: PollingOrderService) { }

  ngOnInit(): void {
    this.subscript1 = this.pollingOrderService.getAllOrders().subscribe({
      next: response => {
        this.pollingOrderList = response.sort(function (a, b) {
          return (a.polling_order_name < b.polling_order_name ? -1 : 1);
        });
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

    this.subscript2 = this.authService.login(email, password, pollingOrder.polling_order_id).subscribe({
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

  ngOnDestroy(): void {
    if (this.subscript1) {
      this.subscript1.unsubscribe();
    }
    if (this.subscript2) {
      this.subscript2.unsubscribe();
    }
  }

}
