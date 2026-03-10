import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

import { PollingOrder } from '../interfaces/polling-order';

const API_URL = environment.apiUrl;

@Injectable({
  providedIn: 'root',
})
export class PollingOrderService {
  constructor(private http: HttpClient) {}

  getAllOrders(): Observable<PollingOrder[]> {
    return this.http.get<PollingOrder[]>(API_URL + '/pollingorder');
  }

  updatePollingOrder(pollingOrderId: number, pollingOrderName: string, pollingOrderAdmin: number, pollingOrderAdminAsst: number, accessToken: string): Observable<PollingOrder> {
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + accessToken
    });

    return this.http.put<PollingOrder>(
      API_URL + '/pollingorder/edit',
      {
        polling_order_name: pollingOrderName,
        polling_order_admin: pollingOrderAdmin,
        polling_order_admin_assistant: pollingOrderAdminAsst,
        polling_order_id: pollingOrderId,
        authToken: accessToken,
        polling_order_notes_time_visible: -1
      },
      { headers: reqHeader }
    );
  }
}
