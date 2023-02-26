import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpRequest } from '@angular/common/http';
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

  createCandidate(name: string, link: string, polling_order_id: string, accessToken: string): Observable<any> {
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
        "link": link,
        "polling_order_id": polling_order_id,
        "pom_created_at": created,
        "authToken": accessToken
      }, { headers: reqHeader }
    );
  }


  createCandidateImage(file: File, candidateId: string, imageDesc: string, accessToken: string): Observable<any> {
    const today = new Date();
    const created = today.toISOString().split('T')[0];
    var reqHeader = new HttpHeaders({
      'Authorization': 'Bearer ' + accessToken
    });

    let re = /(?:\.([^.]+))?$/;
    let fileType = re.exec(file.name)[1];
    
    let formData: FormData = new FormData();
    formData.append('file', file, candidateId + '_' + Math.floor(Date.now() * Math.random()) + '.' + fileType);
    formData.append('candidate_id', candidateId);
    formData.append('authToken', accessToken);
    formData.append('imageDesc', imageDesc);
    const req = new HttpRequest('POST', API_URL + '/candidate/createImage', formData, {
      headers: reqHeader, reportProgress: true,
      responseType: 'json'
    });
    return this.http.request(req);

  }

  getAllCandidateImages(candidate_id: string, accessToken: string): Observable<any> {
    var reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + accessToken
    });

    return this.http.get(API_URL + '/candidate/candidateImages/' + candidate_id, { headers: reqHeader });
  }

  deleteCandidateImage(imageId: string, accessToken: string, candidate_id: string, key: string): Observable<any> {
    const options = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + accessToken
      }),
      body: {
        "image_id": imageId,
        "authToken": accessToken,
        "all": false,
        "candidate_id": candidate_id,
        "keys":[{"Key":key}],
      },
    };
    return this.http.delete(
      API_URL + '/candidate/deleteImage', options
    );
  }


}