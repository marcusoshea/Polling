import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { StorageService } from '../services/storage.service';
import { OrderPoliciesService } from '../services/order-policies.service';
import { OrderPolicies } from '../interfaces/order-policies';
import { PollingOrder } from '../interfaces/polling-order';
import { OrderMember } from '../interfaces/order-member';

@Component({
  selector: 'app-policies',
  templateUrl: './policies.component.html',
  styleUrls: ['./policies.component.css'],
  imports: [
    CommonModule,
    RouterModule
  ]
})
export class PoliciesComponent implements OnInit {
  pollingOrder = {} as PollingOrder;
  member: any;
  orderPolicy: OrderPolicies | null = null;
  private accessToken = '';
  public errorMessage = '';

  constructor(
    private storageService: StorageService,
    private orderPoliciesService: OrderPoliciesService
  ) { }

  async ngOnInit(): Promise<void> {
    this.member = await this.storageService.getMember();
    this.pollingOrder = await this.storageService.getPollingOrder();
    this.accessToken = this.member.access_token;

    // Load the order policy for this polling order
    this.loadOrderPolicy();
  }

  loadOrderPolicy(): void {
    this.orderPoliciesService.getOrderPolicyByPollingOrderId(Number(this.pollingOrder.polling_order_id), this.accessToken)
      .subscribe({
        next: (data) => {
          this.orderPolicy = data;
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Failed to load order policy';
          console.error('Error loading order policy:', this.errorMessage);
        }
      });
  }
}
