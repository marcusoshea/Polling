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

  getCurrentPolling(orderId: Number, accessToken: string): Observable<any> {
    var reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + accessToken
    });

    return this.http.get(API_URL + '/polling/currentpolling/' + orderId, { headers: reqHeader });
  }

  getPollingSummary(pollingId: Number, pollingOrderMemberId: string, accessToken: string): Observable<any> {
    var reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + accessToken
    });

    return this.http.get(API_URL + '/polling/pollingsummary/' + pollingId + '/' + pollingOrderMemberId, { headers: reqHeader });
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

  editPolling(name: string, polling_order_id: string, polling_id: string, start_date: string, end_date: string, accessToken: string): Observable<any> {
    var reqHeader = new HttpHeaders({ 
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + accessToken
   });
    return this.http.put(
      API_URL + '/polling/edit',
      {
        "name": name,
        "polling_order_id": polling_order_id,
        "polling_id": polling_id,
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


  createPollingNotes(body: any, accessToken: string, memberId: number): Observable<any> {
    var reqHeader = new HttpHeaders({ 
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + accessToken
   });
   body[0].authToken = accessToken;
   body[0].polling_order_member_id = memberId;

    return this.http.post(
      API_URL + '/pollingnote/create',
      body, { headers: reqHeader }
    );
  }

  getPollingReport(orderId: Number, accessToken: string): Observable<any> {
    var reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + accessToken
    });

    return this.http.get(API_URL + '/polling/pollingreport/' + orderId, { headers: reqHeader });
  }


  getInProcessPollingReport(orderId: Number, accessToken: string): Observable<any> {
    var reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + accessToken
    });

    return this.http.get(API_URL + '/polling/inprocesspollingreport/' + orderId, { headers: reqHeader });
  }

  getMissingVotesReport(pollingOrderId: number, number: number, accessToken: string): Observable<any> {
    var reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + accessToken
    });
    return this.http.get(`${API_URL}/polling/missingvotes/${pollingOrderId}/${number}`, { headers: reqHeader });
  }

}
