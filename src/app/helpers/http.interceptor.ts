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
// Snappy default for interactive reads/actions.
const DEFAULT_TIMEOUT_MS = 10000;
// File uploads (multipart) get longer; progress events also reset the timer.
const UPLOAD_TIMEOUT_MS = 90000;
// Endpoints that are legitimately slow: SMTP-backed auth flows await the mail send
// before responding; batched vote writes run 1-2 queries per candidate; report
// aggregation transfers large payloads. 10s would false-fail these on slow links.
const SLOW_TIMEOUT_MS = 30000;
const SLOW_PATHS = [
  '/member/create',           // register — awaits clerk-notification email
  '/member/passwordToken',    // forgot password — awaits reset email
  '/pollingnote/create',      // batched vote save/submit
  '/pollingnote/all',
  '/pollingnote/totals',
  '/polling/pollingreport',
  '/polling/inprocesspollingreport',
  '/polling/missingvotes',
];

// 401s from credential/permission RECHECKS (not session expiry) must not clear the
// session or redirect — the calling screen shows the error inline.
const CREDENTIAL_CHECK_PATHS = ['/member/login', '/member/changePassword'];

@Injectable()
export class TheInterceptor implements HttpInterceptor {
  constructor(private storageService: StorageService, @Inject(DOCUMENT) private document: Document) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let timeoutMs = DEFAULT_TIMEOUT_MS;
    if (request.body instanceof FormData) {
      timeoutMs = UPLOAD_TIMEOUT_MS;
    } else if (SLOW_PATHS.some(p => request.url.includes(p))) {
      timeoutMs = SLOW_TIMEOUT_MS;
    }
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

          // 401 from a credential/permission recheck (failed login, wrong current
          // password on change-password) — NOT session expiry. Stay on the page and
          // let it show the error inline instead of clearing state and redirecting.
          case error.status === 401 && CREDENTIAL_CHECK_PATHS.some(p => request.url.includes(p)):
            message = error.error?.message ?? 'The information you entered is incorrect.';
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
