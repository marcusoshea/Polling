import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { PollingOrderService } from '../services/polling-order.service';
import { StorageService } from '../services/storage.service';
import { PollingOrder } from '../interfaces/polling-order'
import { MatTableModule } from '@angular/material/table';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker'; 
import { MatNativeDateModule } from '@angular/material/core';
import { MatListModule } from '@angular/material/list';
import { MatExpansionModule } from '@angular/material/expansion';
import { AngularEditorModule } from '@kolkov/angular-editor';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  imports: [
    MatExpansionModule, 
    MatTableModule, 
    FormsModule, 
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatListModule,
    AngularEditorModule,
    CommonModule
  ],
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
  showError = false;

  constructor(private authService: AuthService, private storageService: StorageService, private pollingOrderService: PollingOrderService) { }

  ngOnInit(): void {
    this.pollingOrderService.getAllOrders().subscribe({
      next: response => {
        this.pollingOrderList = response.sort(function (a, b) {
          return (a.polling_order_name < b.polling_order_name ? -1 : 1);
        });
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
        this.showError = true;
        setTimeout(() => {
          this.showError = false;
        }, 3000);  
        this.errorMessage = err.error.message;
      }
    }); 
  }

}
