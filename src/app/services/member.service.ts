import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment'

const API_URL = environment.apiUrl;

@Injectable({
  providedIn: 'root',
})
export class MemberService {
  constructor(private http: HttpClient) {}

  getAllOrderMembers(orderID: Number, accessToken: string): Observable<any> {
    var reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + accessToken
    });

    return this.http.get(API_URL + '/member/all/' + orderID, { headers: reqHeader });
  }

  getMember(memberId: Number, accessToken: string): Observable<any> {
    var reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + accessToken
    });

    return this.http.get(API_URL + '/member/' + memberId, { headers: reqHeader });
  }
  
  updateMember(memberId: Number, memberName: string, memberEmail: string, memberApproved: boolean, memberOrderId, created, accessToken: string, removed:boolean, active: boolean): Observable<any> {
    var reqHeader = new HttpHeaders({ 
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + accessToken
   });
     
    return this.http.put(
      API_URL + '/member/edit/'+memberId,
      {
        "name": memberName,
        "email": memberEmail,
        "polling_order_id": memberOrderId,
        "polling_order_member_id": memberId,
        "authToken": accessToken,
        "pom_created_at": created,
        "approved": memberApproved,
        "removed": removed,
        "active": active
      }, { headers: reqHeader }
    );
  }

  
  updateProfile(memberId: Number, memberName: string, memberEmail: string, memberOrderId, active: boolean, approved: boolean, removed: boolean, accessToken: string): Observable<any> {
    var reqHeader = new HttpHeaders({ 
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + accessToken
   });
    return this.http.put(
      API_URL + '/member/edit/'+memberId,
      {
        "name": memberName,
        "email": memberEmail,
        "polling_order_member_id": memberId,
        "polling_order_id": memberOrderId,
        "active": active,
        "authToken": accessToken,
        "approved": approved,
        "removed": removed,
      }, { headers: reqHeader }
    );
  }

  removeMember(pollingOrderMemberId: string, accessToken: string): Observable<any> {
    const options = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + accessToken
      }),
      body: {
        "polling_order_member_id": pollingOrderMemberId,
        "authToken": accessToken
      },
    };
    return this.http.delete(
      API_URL + '/member/delete', options
    );
  }

}
