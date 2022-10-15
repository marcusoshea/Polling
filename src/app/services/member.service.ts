import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

const API_URL = 'http://localhost:3000/';

@Injectable({
  providedIn: 'root',
})
export class MemberService {
  constructor(private http: HttpClient) { }

  getAllOrderMembers(orderID: Number, accessToken: string): Observable<any> {
    var reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + accessToken
    });

    return this.http.get(API_URL + 'member/all/' + orderID, { headers: reqHeader });
  }
  
   updateMember(memberId: Number, memberName: string, memberEmail: string, memberApproved: boolean, memberOrderId, created, accessToken: string): Observable<any> {
    var reqHeader = new HttpHeaders({ 
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + accessToken
   });

    return this.http.put(
      API_URL + 'member/edit/'+memberId,
      {
        "name": memberName,
        "email": memberEmail,
        "polling_order_member_id": memberId,
        "approved": memberApproved,
        "polling_order_id": memberOrderId,
        "pom_created_at": created,
        "authToken": accessToken
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
      API_URL + 'member/delete', options
    );
  }

}
