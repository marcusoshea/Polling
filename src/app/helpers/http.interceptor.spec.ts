import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HTTP_INTERCEPTORS, HttpClient, HttpErrorResponse } from '@angular/common/http';
import { DOCUMENT } from '@angular/common';
import { TheInterceptor } from './http.interceptor';
import { StorageService } from '../services/storage.service';

describe('TheInterceptor', () => {
  let httpMock: HttpTestingController;
  let http: HttpClient;
  let storageService: jasmine.SpyObj<StorageService>;
  let replaceSpy: jasmine.Spy;
  let mockDocument: { defaultView: { location: { replace: jasmine.Spy } } };

  beforeEach(() => {
    replaceSpy = jasmine.createSpy('replace');
    mockDocument = { defaultView: { location: { replace: replaceSpy } } };
    storageService = jasmine.createSpyObj('StorageService', ['clean', 'isLoggedIn']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        TheInterceptor,
        { provide: StorageService, useValue: storageService },
        { provide: DOCUMENT, useValue: mockDocument },
        { provide: HTTP_INTERCEPTORS, useClass: TheInterceptor, multi: true }
      ]
    });

    httpMock = TestBed.inject(HttpTestingController);
    http = TestBed.inject(HttpClient);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should pass through successful requests unchanged', (done) => {
    http.get('/api/test').subscribe({
      next: (res: any) => {
        expect(res.data).toBe('ok');
        done();
      }
    });

    const req = httpMock.expectOne('/api/test');
    req.flush({ data: 'ok' });
  });

  it('should normalize 404 error to use API message', (done) => {
    http.get('/api/test').subscribe({
      error: (err: HttpErrorResponse) => {
        expect(err.error.message).toBe('Resource not found');
        done();
      }
    });

    const req = httpMock.expectOne('/api/test');
    req.flush({ message: 'Resource not found' }, { status: 404, statusText: 'Not Found' });
  });

  it('should return generic message for 500 server error', (done) => {
    http.get('/api/test').subscribe({
      error: (err: HttpErrorResponse) => {
        expect(err.error.message).toBe('A server error occurred. Please try again later.');
        done();
      }
    });

    const req = httpMock.expectOne('/api/test');
    req.flush({ message: 'DB connection failed' }, { status: 500, statusText: 'Internal Server Error' });
  });

  it('should return permission message for 403 error', (done) => {
    http.get('/api/test').subscribe({
      error: (err: HttpErrorResponse) => {
        expect(err.error.message).toBe('You do not have permission to perform this action.');
        done();
      }
    });

    const req = httpMock.expectOne('/api/test');
    req.flush({}, { status: 403, statusText: 'Forbidden' });
  });

  it('should return connection message for status 0 (network error)', (done) => {
    http.get('/api/test').subscribe({
      error: (err: HttpErrorResponse) => {
        expect(err.error.message).toBe('Unable to connect to the server. Please check your connection.');
        done();
      }
    });

    const req = httpMock.expectOne('/api/test');
    req.error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });
  });

  it('should call storageService.clean() on 401', (done) => {
    http.get('/api/test').subscribe({
      error: () => {
        expect(storageService.clean).toHaveBeenCalled();
        done();
      }
    });

    const req = httpMock.expectOne('/api/test');
    req.flush({}, { status: 401, statusText: 'Unauthorized' });
  });

  it('should redirect to /login on 401', (done) => {
    http.get('/api/test').subscribe({
      error: () => {
        expect(replaceSpy).toHaveBeenCalledWith('/login');
        done();
      }
    });

    const req = httpMock.expectOne('/api/test');
    req.flush({}, { status: 401, statusText: 'Unauthorized' });
  });

  it('should preserve original error in normalizedError.error.originalError', (done) => {
    http.get('/api/test').subscribe({
      error: (err: HttpErrorResponse) => {
        expect(err.error.originalError).toEqual({ message: 'Not found' });
        done();
      }
    });

    const req = httpMock.expectOne('/api/test');
    req.flush({ message: 'Not found' }, { status: 404, statusText: 'Not Found' });
  });

  it('should fall back to statusText when API provides no message', (done) => {
    http.get('/api/test').subscribe({
      error: (err: HttpErrorResponse) => {
        expect(err.error.message).toBe('Not Found');
        done();
      }
    });

    const req = httpMock.expectOne('/api/test');
    req.flush(null, { status: 404, statusText: 'Not Found' });
  });
});
