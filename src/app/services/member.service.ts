import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

import { OrderMember } from '../interfaces/order-member';

const API_URL = environment.apiUrl;

@Injectable({
  providedIn: 'root',
})
export class MemberService {
  constructor(private http: HttpClient) {}

  getAllOrderMembers(orderID: number, accessToken: string): Observable<OrderMember[]> {
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + accessToken
    });

    return this.http.get<OrderMember[]>(API_URL + '/member/all/' + orderID, { headers: reqHeader });
  }

  getMember(memberId: number, accessToken: string): Observable<OrderMember> {
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + accessToken
    });

    return this.http.get<OrderMember>(API_URL + '/member/' + memberId, { headers: reqHeader });
  }

  updateMember(memberId: number, memberName: string, memberEmail: string, memberApproved: boolean, memberOrderId: number, created: string, accessToken: string, removed: boolean, active: boolean): Observable<void> {
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + accessToken
    });

    return this.http.put<void>(
      API_URL + '/member/edit/' + memberId,
      {
        name: memberName,
        email: memberEmail,
        polling_order_id: memberOrderId,
        polling_order_member_id: memberId,
        authToken: accessToken,
        pom_created_at: created,
        approved: memberApproved,
        removed,
        active
      },
      { headers: reqHeader }
    );
  }

  updateProfile(memberId: number, memberName: string, memberEmail: string, memberOrderId: number, active: boolean, approved: boolean, removed: boolean, accessToken: string): Observable<void> {
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + accessToken
    });
    return this.http.put<void>(
      API_URL + '/member/edit/' + memberId,
      {
        name: memberName,
        email: memberEmail,
        polling_order_member_id: memberId,
        polling_order_id: memberOrderId,
        active,
        authToken: accessToken,
        approved,
        removed,
      },
      { headers: reqHeader }
    );
  }

  removeMember(pollingOrderMemberId: number, accessToken: string): Observable<void> {
    const options = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + accessToken
      }),
      body: {
        polling_order_member_id: pollingOrderMemberId,
        authToken: accessToken
      },
    };
    return this.http.delete<void>(API_URL + '/member/delete', options);
  }
}
