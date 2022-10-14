import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

const API_URL = 'http://localhost:3000';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({
  providedIn: 'root',
})
export class PollingOrderService {
  constructor(private http: HttpClient) {}

  getAllOrders(): Observable<any> {
    return this.http.get(API_URL + '/pollingorder');
  }

  updatePollingOrder(pollingOrderId: Number, pollingOrderName: string, pollingOrderAdmin: string, pollingOrderAdminAsst: string, accessToken: string): Observable<any> {
    var reqHeader = new HttpHeaders({ 
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + accessToken
   });

    return this.http.put(
      API_URL + '/pollingorder/edit',
      {
        "polling_order_name": pollingOrderName,
        "polling_order_admin": pollingOrderAdmin,
        "polling_order_admin_assistant": pollingOrderAdminAsst,
        "polling_order_id": pollingOrderId,
        "authToken": accessToken
      }, { headers: reqHeader }
    );
  }
}
