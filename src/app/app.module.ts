import { ApplicationConfig, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, provideHttpClient, withFetch } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { LoginComponent } from './login/login.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { RegisterComponent } from './register/register.component';
import { HomeComponent } from './home/home.component';
import { ProfileComponent } from './profile/profile.component';
import { AdminComponent } from './admin/admin.component';
import { MatSelectModule} from '@angular/material/select';
import { MatDialogModule } from '@angular/material/dialog';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { CandidatesComponent } from './candidates/candidates.component';
import { CandidateImagesComponent } from './candidate-images/candidate-images.component';
import { PollingCandidate, PollingsComponent } from './pollings/pollings.component';
import { MatTableModule,MatTableDataSource} from '@angular/material/table';
import { MatPaginatorModule} from '@angular/material/paginator';
import { MatInputModule} from '@angular/material/input';
import { MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { MatSortModule} from '@angular/material/sort';
import { MatExpansionModule} from '@angular/material/expansion';
import { MatNativeDateModule} from '@angular/material/core';
import { MatDatepickerModule} from '@angular/material/datepicker';
import { MatListModule} from '@angular/material/list';
import { CommonModule } from '@angular/common';  
import { ReportComponent } from './report/report.component';
import { AngularEditorModule } from '@kolkov/angular-editor';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { bootstrapApplication } from '@angular/platform-browser';
import { RouterModule, RouterOutlet } from '@angular/router';

@NgModule({
  declarations: [

  ],
  imports: [
    AngularEditorModule, 
    BrowserModule,
    CommonModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    FormsModule,
    HttpClientModule,
    MatDialogModule,
    ReactiveFormsModule,
    MatListModule,
    MatSelectModule,
    MatTableModule,
    MatSortModule,
    MatProgressSpinnerModule,
    MatInputModule,
    MatPaginatorModule,
    MatExpansionModule,
    MatNativeDateModule,
    MatDatepickerModule,
    RouterModule,
    RouterOutlet
  ],
  providers: [
    provideAnimationsAsync(), provideHttpClient(), HttpClientModule
  ]
})
export class AppModule { }

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withFetch())
  ]
};

bootstrapApplication(AppComponent, {
  providers: [appConfig.providers],
});

