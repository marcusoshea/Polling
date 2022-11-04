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
export class NotesService {
  constructor(private http: HttpClient) { }

  getExternalNoteByCandidateId(id: Number, accessToken: string): Observable<any> {
    var reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + accessToken
    });

    return this.http.get(API_URL + '/externalnote/candidate/' + id, { headers: reqHeader });
  }

  
  getPollingNoteByCandidateId(id: Number, accessToken: string): Observable<any> {
    var reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + accessToken
    });

    return this.http.get(API_URL + '/polling/allpn/' + id, { headers: reqHeader });
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

  createExternalNote(external_note: string, candidate_id: string, polling_order_member_id: string, accessToken: string): Observable<any> {
    const today = new Date();
    today.setDate(today.getDate() + 1);
    const created = today.toISOString().split('T')[0];
    var reqHeader = new HttpHeaders({ 
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + accessToken
   });
    return this.http.post(
      API_URL + '/externalnote/create',
      {
        "external_note": external_note,
        "candidate_id": candidate_id,
        "polling_order_member_id": polling_order_member_id,
        "en_created_at": created,
        "authToken": accessToken
      }, { headers: reqHeader }
    );
  }

  getPollingReportTotals(pollingId: Number, accessToken: string): Observable<any> {
    var reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + accessToken
    });

    return this.http.get(API_URL + '/pollingnote/totals/' + pollingId, { headers: reqHeader });
  }


}
