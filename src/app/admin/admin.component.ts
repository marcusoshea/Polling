import { Component, OnInit } from '@angular/core';
import { MemberService } from '../_services/member.service';
import { StorageService } from '../_services/storage.service';
import { Router } from '@angular/router';

interface OrderMember {
  polling_order_member_id: Number;
  name: String;
  email: Number;
}

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {
  form: any = {
    email: null,
    password: null,
    pollingOrder: null
  };
 
  orderMemberList: OrderMember[] = [];

  constructor(private memberService: MemberService, private storageService: StorageService, private router: Router) { }

  private pollingOrder = '';
  private showAdmin = false;
  private errorMessage = '';
  private accessToken = '';

  async ngOnInit(): Promise<void> {
    const user = await this.storageService.getUser();
    this.pollingOrder = user.pollingOrder;
    this.showAdmin = user.isOrderAdmin;
    this.accessToken = user.access_token;

    if (!this.showAdmin) {
      this.router.navigate(['/home']);
    }

    this.memberService.getAllOrderMembers(this.pollingOrder, this.accessToken).subscribe({
      next: data => {
        this.orderMemberList = data;
      },
      error: err => {
        this.errorMessage = err.error.message;
      }
    });

  }

  onSubmit(): void {
   
  }


}
