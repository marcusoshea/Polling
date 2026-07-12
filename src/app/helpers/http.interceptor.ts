import { Inject, Injectable } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import {
  HttpInterceptor,
  HttpEvent,
  HttpRequest,
  HttpHandler,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { StorageService } from '../services/storage.service';

// HttpClient has NO default timeout: a hung server leaves requests pending forever,
// so error handlers (and their UI feedback / button re-enabling) never run.
const DEFAULT_TIMEOUT_MS = 10000;
// File uploads (multipart) get longer; progress events also reset the timer.
const UPLOAD_TIMEOUT_MS = 90000;

@Injectable()
export class TheInterceptor implements HttpInterceptor {
  constructor(private storageService: StorageService, @Inject(DOCUMENT) private document: Document) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const timeoutMs = request.body instanceof FormData ? UPLOAD_TIMEOUT_MS : DEFAULT_TIMEOUT_MS;
    return next.handle(request).pipe(
      timeout(timeoutMs),
      catchError((caught: unknown) => {
        if (caught instanceof TimeoutError) {
          return throwError(() => new HttpErrorResponse({
            error: { message: 'The server is not responding. Please check your connection and try again.' },
            status: 0,
            statusText: 'Timeout',
            url: request.url ?? undefined
          }));
        }
        const error = caught as HttpErrorResponse;
        let message: string;

        switch (true) {
          case error.status === 0:
            message = 'Unable to connect to the server. Please check your connection.';
            break;

          // A failed login attempt is also a 401 — stay on the login page and
          // let it display the error instead of clearing state and reloading.
          case error.status === 401 && request.url.includes('/member/login'):
            message = error.error?.message ?? 'Invalid email or password.';
            break;

          case error.status === 401:
            this.storageService.clean();
            this.document.defaultView?.location.replace('/login');
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
