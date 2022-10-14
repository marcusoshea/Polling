import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

const AUTH_API = 'http://localhost:3000';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private http: HttpClient) {}

  login(email: string, password: string, polling_order_id: string): Observable<any> {
    return this.http.post(
      AUTH_API + '/member/login',
      {
        "email": email,
        "password": password,
        "polling_order_id": polling_order_id
      },        
      httpOptions
    );
  }

  register(email: string, password: string, polling_order_id: string): Observable<any> {
    return this.http.post(
      AUTH_API + '/member/signup',
      {
        "email": email,
        "password": password, 
        "polling_order_id": polling_order_id
      },
      httpOptions
    );
  }

}
