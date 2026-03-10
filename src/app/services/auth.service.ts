import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ActivatedRoute } from '@angular/router';

import { environment } from '../../environments/environment';
import { AuthUser } from '../interfaces/auth-user';

const API_URL = environment.apiUrl;

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private http: HttpClient, private activatedRoute: ActivatedRoute) {}

  login(email: string, password: string, polling_order_id: number): Observable<AuthUser> {
    return this.http.post<AuthUser>(
      API_URL + '/member/login',
      {
        email,
        password,
        polling_order_id
      },
      httpOptions
    );
  }

  register(memberName: string, email: string, password: string, polling_order_id: number): Observable<AuthUser> {
    const today = new Date();
    const created = today.toISOString().split('T')[0];

    return this.http.post<AuthUser>(
      API_URL + '/member/create',
      {
        name: memberName,
        email,
        password,
        polling_order_id,
        pom_created_at: created,
      },
      httpOptions
    );
  }

  forceRegister(memberName: string, email: string, password: string, polling_order_id: number, accessToken: string): Observable<AuthUser> {
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + accessToken
    });

    const today = new Date();
    const created = today.toISOString().split('T')[0];

    return this.http.post<AuthUser>(
      API_URL + '/member/forcecreate',
      {
        name: memberName,
        email,
        password,
        polling_order_id,
        pom_created_at: created,
        authToken: accessToken,
        approved: true
      },
      { headers: reqHeader }
    );
  }

  getPasswordToken(email: string, polling_order_id: number): Observable<void> {
    return this.http.post<void>(
      API_URL + '/member/passwordToken',
      {
        email,
        polling_order_id
      },
      httpOptions
    );
  }

  async resetPassword(email: string, password: string): Promise<Observable<void>> {
    const token = this.activatedRoute.snapshot.queryParamMap.get('token');
    return this.http.post<void>(
      API_URL + '/member/verify/' + token,
      {
        email,
        password
      }
    );
  }

  updatePassword(email: string, password: string, newPassword: string, pollingOrderId: number, accessToken: string): Observable<void> {
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + accessToken
    });

    return this.http.put<void>(
      API_URL + '/member/changePassword',
      {
        email,
        password,
        newPassword,
        pollingOrderId
      },
      { headers: reqHeader }
    );
  }
}
