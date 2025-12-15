import { Component, OnInit } from '@angular/core';
import { StorageService } from './services/storage.service';
import { AuthService } from './services/auth.service';
import { OrderPoliciesService } from './services/order-policies.service';
import { PollingOrder } from './interfaces/polling-order';
import { RouterModule, RouterOutlet, RouterLink, RouterLinkActive, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';  
import { provideRouter } from '@angular/router';
import { environment } from '../environments/environment'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterModule,
    CommonModule,
    RouterLink,
  ],
  styleUrls: ['./app.component.css']
}) 
export class AppComponent implements OnInit {
  isLoggedIn = false;
  showAdmin = false;
  showModeratorBoard = false;
  email?: string;
  title = 'polling';
  pollingOrder = {} as PollingOrder;
  feedbackEmail = environment.feedbackEmail;
  hasPolicies = false;
  
  constructor(
    private storageService: StorageService, 
    private authService: AuthService, 
    private activatedRoute: ActivatedRoute,
    private orderPoliciesService: OrderPoliciesService
  ) { }

  ngOnInit() {
    this.isLoggedIn = this.storageService.isLoggedIn();

    if (this.isLoggedIn) {
      const user = this.storageService.getMember();
      this.pollingOrder = this.storageService.getPollingOrder();
      this.showAdmin = user.isOrderAdmin;
      this.email = user.email;
      
      // Check if policies exist for this order
      if (this.pollingOrder?.polling_order_id) {
        this.checkPoliciesExist(user.access_token);
      }
    } else {
      if(window.location.pathname.includes('profile') || window.location.pathname.includes('admin')
      || window.location.pathname.includes('candidates') || window.location.pathname.includes('pollings')
      || window.location.pathname.includes('report') ) {
        location.replace('/login');
      }
    }
    this.activatedRoute.params.subscribe(params => {
      this.authService.handleRouteInfo(params);
      console.log(params)
    });
  }

  checkPoliciesExist(accessToken: string): void {
    this.orderPoliciesService.getOrderPolicyByPollingOrderId(
      Number(this.pollingOrder.polling_order_id), 
      accessToken
    ).subscribe({
      next: (data) => {
        this.hasPolicies = data !== null && data !== undefined;
      },
      error: (err) => {
        // If there's an error, assume no policies exist
        this.hasPolicies = false;
      }
    });
  }

  logout(): void {
    this.storageService.clean();
    window.location.reload();
  }
}
