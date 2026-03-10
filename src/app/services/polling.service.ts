import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

import { Polling } from '../interfaces/polling';
import { PollingSummary } from '../interfaces/polling-summary';

const API_URL = environment.apiUrl;

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({
  providedIn: 'root',
})
export class PollingService {
  constructor(private http: HttpClient) { }

  getAllPollings(orderID: number, accessToken: string): Observable<Polling[]> {
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + accessToken
    });

    return this.http.get<Polling[]>(API_URL + '/polling/all/' + orderID, { headers: reqHeader });
  }

  getPolling(pollingId: number, accessToken: string): Observable<Polling> {
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + accessToken
    });

    return this.http.get<Polling>(API_URL + '/polling/' + pollingId, { headers: reqHeader });
  }

  getCurrentPolling(orderId: number, accessToken: string): Observable<Polling> {
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + accessToken
    });

    return this.http.get<Polling>(API_URL + '/polling/currentpolling/' + orderId, { headers: reqHeader });
  }

  getPollingSummary(pollingId: number, pollingOrderMemberId: string, accessToken: string): Observable<PollingSummary[]> {
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + accessToken
    });

    return this.http.get<PollingSummary[]>(API_URL + '/polling/pollingsummary/' + pollingId + '/' + pollingOrderMemberId, { headers: reqHeader });
  }

  removePolling(pollingId: number, accessToken: string): Observable<void> {
    const options = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + accessToken
      }),
      body: {
        polling_id: pollingId,
        authToken: accessToken
      },
    };
    return this.http.delete<void>(API_URL + '/polling/delete', options);
  }

  createPolling(name: string, polling_order_id: number, start_date: string, end_date: string, accessToken: string): Observable<Polling> {
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + accessToken
    });
    return this.http.post<Polling>(
      API_URL + '/polling/create',
      {
        name,
        polling_order_id,
        start_date,
        end_date,
        authToken: accessToken
      },
      { headers: reqHeader }
    );
  }

  editPolling(name: string, polling_order_id: number, polling_id: number, start_date: string, end_date: string, accessToken: string): Observable<Polling> {
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + accessToken
    });
    return this.http.put<Polling>(
      API_URL + '/polling/edit',
      {
        name,
        polling_order_id,
        polling_id,
        start_date,
        end_date,
        authToken: accessToken
      },
      { headers: reqHeader }
    );
  }

  createPollingCandidates(pollingCandidates: Array<{ polling_id: number; candidate_id: number; authToken: string }>, accessToken: string): Observable<void> {
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + accessToken
    });
    return this.http.post<void>(API_URL + '/polling/candidates', pollingCandidates, { headers: reqHeader });
  }

  createPollingNotes(body: Array<{ polling_id: number; candidate_id: number; polling_candidate_id: number; note: string; vote: number; authToken?: string; polling_order_member_id?: number }>, accessToken: string, memberId: number): Observable<void> {
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + accessToken
    });
    body[0].authToken = accessToken;
    body[0].polling_order_member_id = memberId;

    return this.http.post<void>(API_URL + '/pollingnote/create', body, { headers: reqHeader });
  }

  getPollingReport(orderId: number, accessToken: string): Observable<PollingSummary[]> {
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + accessToken
    });

    return this.http.get<PollingSummary[]>(API_URL + '/polling/pollingreport/' + orderId, { headers: reqHeader });
  }

  getInProcessPollingReport(orderId: number, accessToken: string): Observable<PollingSummary[]> {
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + accessToken
    });

    return this.http.get<PollingSummary[]>(API_URL + '/polling/inprocesspollingreport/' + orderId, { headers: reqHeader });
  }

  getMissingVotesReport(pollingOrderId: number, number: number, accessToken: string): Observable<unknown> {
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + accessToken
    });
    return this.http.get(`${API_URL}/polling/missingvotes/${pollingOrderId}/${number}`, { headers: reqHeader });
  }
}
