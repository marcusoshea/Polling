import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RegisterComponent } from './register/register.component';
import { LoginComponent } from './login/login.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { HomeComponent } from './home/home.component';
import { ProfileComponent } from './profile/profile.component';
import { AdminComponent } from './admin/admin.component';
import { CandidatesComponent } from './candidates/candidates.component';
import { PollingsComponent } from './pollings/pollings.component';
import { ReportComponent } from './report/report.component';
import { CandidateImagesComponent } from './candidate-images/candidate-images.component';


export const routes: Routes = [
  { path: 'home', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'admin', component: AdminComponent },
  { path: 'candidates', component: CandidatesComponent },
  { path: 'candidate-images', component: CandidateImagesComponent },
  { path: 'pollings', component: PollingsComponent },
  { path: 'report', component: ReportComponent },
  { path: '', redirectTo: 'home', pathMatch: 'full' }
]; 

@NgModule({
  imports: [RouterModule,RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
