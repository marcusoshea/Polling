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
export class CandidateService {
  constructor(private http: HttpClient) { }

  getAllCandidates(orderID: Number, accessToken: string): Observable<any> {
    var reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + accessToken
    });

    return this.http.get(API_URL + '/candidate/all/' + orderID, { headers: reqHeader });
  }

  getCandidate(candidateId: Number, accessToken: string): Observable<any> {
    var reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + accessToken
    });

    return this.http.get(API_URL + '/candidate/' + candidateId, { headers: reqHeader });
  }

  removeCandidate(candidateId: string, accessToken: string): Observable<any> {
    const options = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + accessToken
      }),
      body: {
        "candidate_id": candidateId,
        "authToken": accessToken
      },
    };
    return this.http.delete(
      API_URL + '/candidate/delete', options
    );
  }

  createCandidate(name: string, polling_order_id: string, accessToken: string): Observable<any> {
    const today = new Date();
    const created = today.toISOString().split('T')[0];
    var reqHeader = new HttpHeaders({ 
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + accessToken
   });
    return this.http.post(
      API_URL + '/candidate/create',
      {
        "name": name,
        "polling_order_id": polling_order_id,
        "pom_created_at": created,
        "authToken": accessToken
      }, { headers: reqHeader }
    );
  }

}
