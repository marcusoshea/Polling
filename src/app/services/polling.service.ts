import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment'

const API_URL = environment.apiUrl;

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({
  providedIn: 'root',
})
export class PollingService {
  constructor(private http: HttpClient) { }

  getAllPollings(orderID: Number, accessToken: string): Observable<any> {
    var reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + accessToken
    });

    return this.http.get(API_URL + '/polling/all/' + orderID, { headers: reqHeader });
  }

  getPolling(pollingId: Number, accessToken: string): Observable<any> {
    var reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + accessToken
    });

    return this.http.get(API_URL + '/polling/' + pollingId, { headers: reqHeader });
  }

  removePolling(pollingId: string, accessToken: string): Observable<any> {
    const options = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + accessToken
      }),
      body: {
        "polling_id": pollingId,
        "authToken": accessToken
      },
    };
    return this.http.delete(
      API_URL + '/polling/delete', options
    );
  }

  createPolling(name: string, polling_order_id: string, start_date: string, end_date: string, accessToken: string): Observable<any> {
    var reqHeader = new HttpHeaders({ 
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + accessToken
   });
    return this.http.post(
      API_URL + '/polling/create',
      {
        "name": name,
        "polling_order_id": polling_order_id,
        "start_date": start_date,
        "end_date": end_date,
        "authToken": accessToken
      }, { headers: reqHeader }
    );
  }

  createPollingCandidates(pollingCandidates: string[], accessToken: string): Observable<any> {
    var reqHeader = new HttpHeaders({ 
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + accessToken
   });
    return this.http.post(
      API_URL + '/polling/candidates',
      pollingCandidates, { headers: reqHeader }
    );
  }

}
