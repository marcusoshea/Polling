import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { OrderPolicies, CreateOrderPolicyRequest, UpdateOrderPolicyRequest } from '../interfaces/order-policies';

@Injectable({
  providedIn: 'root'
})
export class OrderPoliciesService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  private getHeaders(authToken: string): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    });
  }

  /**
   * Create a new order policy
   */
  createOrderPolicy(request: CreateOrderPolicyRequest): Observable<OrderPolicies> {
    const headers = this.getHeaders(request.authToken);
    return this.http.post<OrderPolicies>(`${this.apiUrl}/order-policies`, request, { headers });
  }

  /**
   * Get order policy by polling order ID
   */
  getOrderPolicyByPollingOrderId(pollingOrderId: number, authToken: string): Observable<OrderPolicies | null> {
    const headers = this.getHeaders(authToken);
    return this.http.get<OrderPolicies | null>(`${this.apiUrl}/order-policies/polling-order/${pollingOrderId}`, { headers });
  }

  /**
   * Update an existing order policy
   */
  updateOrderPolicy(orderPolicyId: number, request: UpdateOrderPolicyRequest): Observable<OrderPolicies> {
    const headers = this.getHeaders(request.authToken);
    return this.http.put<OrderPolicies>(`${this.apiUrl}/order-policies/${orderPolicyId}`, request, { headers });
  }

  /**
   * Delete an order policy
   */
  deleteOrderPolicy(orderPolicyId: number, authToken: string): Observable<{ message: string }> {
    const headers = this.getHeaders(authToken);
    return this.http.delete<{ message: string }>(`${this.apiUrl}/order-policies/${orderPolicyId}`, { headers });
  }

  /**
   * Get all order policies for the user's polling order (Admin only)
   */
  getAllOrderPolicies(authToken: string): Observable<OrderPolicies[]> {
    const headers = this.getHeaders(authToken);
    return this.http.get<OrderPolicies[]>(`${this.apiUrl}/order-policies`, { headers });
  }
}
