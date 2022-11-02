import { Component, OnInit } from '@angular/core';
import { MemberService } from '../services/member.service';
import { StorageService } from '../services/storage.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  private accessToken = '';
  private member: any;
  private errorMessage = '';
  form: any = {
    name: null,
    email: null,
    password: null,
    newPassword: null,
    pollingOrder: null,
    active: null
  };
  isRegistered = false;
  showMessage = false;
  showPasswordMessage=false;
  showPasswordError=false;
  showError=false;

  constructor(private memberService: MemberService, private storageService: StorageService, private authService: AuthService) { }

  async ngOnInit(): Promise<void> {
   await this.getMemberInfo();
  }

  async getMemberInfo(): Promise<void> { 
    this.member = await this.storageService.getMember();
    this.form.name = this.member.name;
    this.form.email = this.member.email;
    this.form.pollingOrder = this.member.pollingOrder;
    this.accessToken = this.member.access_token;
    this.form.active = this.member.active;

  }
  
  onSubmit(): void {
    this.memberService.updateProfile(this.member.memberId, this.form.name, this.form.email, this.member.pollingOrder, this.form.active, true, false, this.accessToken)
   .subscribe({
      next: data => {
        this.storageService.clean();
        this.showMessage = true;
        setTimeout(() => {
          this.showMessage = false;
          location.replace('login');
        }, 3000); 

      },
      error: err => {
        this.showError = true;
        setTimeout(() => {
          this.showError = false;
        }, 3000); 
        this.errorMessage = err.error.message;
      }
    }); 
  }

  onSubmitPassword(): void {
    this.authService.updatePassword(this.member.email, this.form.password, this.form.newPassword, this.member.pollingOrder, this.accessToken)
   .subscribe({
      next: data => {
        this.storageService.clean();
        this.showPasswordMessage = true;
        setTimeout(() => {
          this.showPasswordMessage = false;
          location.replace('login');
        }, 3000); 

      },
      error: err => {
        this.showPasswordError = true;
        setTimeout(() => {
          this.showPasswordError = false;
        }, 3000); 
        this.errorMessage = err?.error?.message;
      }
    }); 
  }
}
