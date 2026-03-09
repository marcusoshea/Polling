import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpEvent,
  HttpRequest,
  HttpHandler,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { StorageService } from '../services/storage.service';

@Injectable()
export class TheInterceptor implements HttpInterceptor {
  constructor(private storageService: StorageService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        let message: string;

        switch (true) {
          case error.status === 0:
            message = 'Unable to connect to the server. Please check your connection.';
            break;

          case error.status === 401:
            this.storageService.clean();
            location.replace('/login');
            message = 'Your session has expired. Please log in again.';
            break;

          case error.status === 403:
            message = 'You do not have permission to perform this action.';
            break;

          case error.status >= 500:
            message = 'A server error occurred. Please try again later.';
            break;

          default:
            // Use API-provided message if available
            message = error.error?.message ?? error.statusText ?? 'An unexpected error occurred.';
        }

        const normalizedError = new HttpErrorResponse({
          error: { message, originalError: error.error },
          headers: error.headers,
          status: error.status,
          statusText: error.statusText,
          url: error.url
        });

        return throwError(() => normalizedError);
      })
    );
  }
}
