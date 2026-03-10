import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpRequest, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

import { Candidate } from '../interfaces/candidate';
import { CandidateImages } from '../interfaces/candidateImages';

const API_URL = environment.apiUrl;

@Injectable({
  providedIn: 'root',
})
export class CandidateService {
  constructor(private http: HttpClient) { }

  getAllCandidates(orderID: number, accessToken: string): Observable<Candidate[]> {
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + accessToken
    });

    return this.http.get<Candidate[]>(API_URL + '/candidate/all/' + orderID, { headers: reqHeader });
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

  editCandidate(candidateInfo: Candidate, accessToken: string): Observable<Candidate> {
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + accessToken
    });

    return this.http.put<Candidate>(
      API_URL + '/candidate/edit',
      {
        candidate_id: candidateInfo.candidate_id,
        watch_list: candidateInfo.watch_list,
        name: candidateInfo.name,
        polling_order_id: candidateInfo.polling_order_id,
        authToken: accessToken
      },
      { headers: reqHeader }
    );
  }

  createCandidate(name: string, link: string, polling_order_id: number, accessToken: string): Observable<Candidate> {
    const today = new Date();
    const created = today.toISOString().split('T')[0];
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + accessToken
    });
    return this.http.post<Candidate>(
      API_URL + '/candidate/create',
      {
        name,
        link,
        polling_order_id,
        pom_created_at: created,
        authToken: accessToken
      },
      { headers: reqHeader }
    );
  }

  createCandidateImage(file: File, candidateId: number, imageDesc: string, accessToken: string): Observable<HttpEvent<unknown>> {
    const reqHeader = new HttpHeaders({
      'Authorization': 'Bearer ' + accessToken
    });

    const re = /(?:\.([^.]+))?$/;
    const fileType = re.exec(file.name)?.[1] ?? '';

    const formData: FormData = new FormData();
    formData.append('file', file, candidateId + '_' + Math.floor(Date.now() * Math.random()) + '.' + fileType);
    formData.append('candidate_id', String(candidateId));
    formData.append('authToken', accessToken);
    formData.append('imageDesc', imageDesc);
    const req = new HttpRequest('POST', API_URL + '/candidate/createImage', formData, {
      headers: reqHeader, reportProgress: true,
      responseType: 'json'
    });
    return this.http.request(req);
  }

  getAllCandidateImages(candidate_id: number, accessToken: string): Observable<CandidateImages[]> {
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + accessToken
    });

    return this.http.get<CandidateImages[]>(API_URL + '/candidate/candidateImages/' + candidate_id, { headers: reqHeader });
  }

  deleteCandidateImage(imageId: number, accessToken: string, candidate_id: number, key: string): Observable<void> {
    const options = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + accessToken
      }),
      body: {
        image_id: imageId,
        authToken: accessToken,
        all: false,
        candidate_id,
        keys: [{ Key: key }],
      },
    };
    return this.http.delete<void>(API_URL + '/candidate/deleteImage', options);
  }
}
