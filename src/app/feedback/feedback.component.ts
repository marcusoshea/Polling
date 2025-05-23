import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-feedback',
  templateUrl: './feedback.component.html',
  styleUrls: ['./feedback.component.css'],
  imports: [CommonModule, FormsModule]
})
export class FeedbackComponent {
  feedback = {
    name: '',
    email: '',
    message: ''
  };
  feedbackEmail = environment.feedbackEmail;
  isSubmitted = false;
  errorMessage = '';
  API_URL = environment.apiUrl;


  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    // Retrieve the email from sessionStorage
    const authUser = sessionStorage.getItem('auth-user');
    if (authUser) {
      try {
        const user = JSON.parse(authUser); // Parse the JSON string
        this.feedback.email = user.email || ''; // Set the email if it exists
        this.feedback.name = user.name || ''; // Set the email if it exists
      } catch (error) {
        console.error('Failed to parse auth-user from sessionStorage:', error);
      }
    }
  }

  onSubmit() {
    const feedbackData = {
      name: this.feedback.name,
      email: this.feedback.email,
      message: this.feedback.message
    };

    this.http.post(this.API_URL + '/feedback', feedbackData).subscribe({
      next: () => {
        console.log('Feedback submitted successfully!');
        this.isSubmitted = true;
      },
      error: (err) => {
        console.error('Failed to submit feedback:', err);
        this.errorMessage = 'Failed to submit feedback. Please try again later.';
      }
    });
  }
}