import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

import { Note } from '../interfaces/note';
import { PollingNote } from '../interfaces/polling-note';
import { Candidate } from '../interfaces/candidate';

const API_URL = environment.apiUrl;

@Injectable({
  providedIn: 'root',
})
export class NotesService {
  constructor(private http: HttpClient) { }

  getExternalNoteByCandidateId(id: number, accessToken: string): Observable<Note[]> {
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + accessToken
    });

    return this.http.get<Note[]>(API_URL + '/externalnote/candidate/' + id, { headers: reqHeader });
  }

  getPollingNoteByCandidateId(id: number, accessToken: string): Observable<PollingNote[]> {
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + accessToken
    });

    return this.http.get<PollingNote[]>(API_URL + '/polling/allpn/' + id, { headers: reqHeader });
  }

  getAllPollingNotesById(id: number, accessToken: string): Observable<PollingNote[]> {
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + accessToken
    });

    return this.http.post<PollingNote[]>(
      API_URL + '/pollingnote/all',
      {
        polling_notes_id: id,
        authToken: accessToken
      },
      { headers: reqHeader }
    );
  }

  getCandidate(candidateId: number, accessToken: string): Observable<Candidate> {
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + accessToken
    });

    return this.http.get<Candidate>(API_URL + '/candidate/' + candidateId, { headers: reqHeader });
  }

  removeCandidate(candidateId: number, accessToken: string): Observable<void> {
    const options = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + accessToken
      }),
      body: {
        candidate_id: candidateId,
        authToken: accessToken
      },
    };
    return this.http.delete<void>(API_URL + '/candidate/delete', options);
  }

  createExternalNote(external_note: string, candidate_id: number, polling_order_member_id: number, accessToken: string): Observable<Note> {
    const today = new Date();
    today.setDate(today.getDate() + 1);
    const created = today.toISOString().split('T')[0];
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + accessToken
    });
    return this.http.post<Note>(
      API_URL + '/externalnote/create',
      {
        external_note,
        candidate_id,
        polling_order_member_id,
        en_created_at: created,
        authToken: accessToken
      },
      { headers: reqHeader }
    );
  }

  removeExternalNote(note_id: number, polling_order_member_id: number, accessToken: string): Observable<void> {
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + accessToken
    });
    return this.http.post<void>(
      API_URL + '/externalnote/delete',
      {
        external_notes_id: note_id,
        polling_order_member_id,
        authToken: accessToken
      },
      { headers: reqHeader }
    );
  }

  getPollingReportTotals(pollingId: number, accessToken: string): Observable<PollingNote[]> {
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + accessToken
    });

    return this.http.get<PollingNote[]>(API_URL + '/pollingnote/totals/' + pollingId, { headers: reqHeader });
  }
}
