import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

const API_URL = environment.apiUrl;

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap({ token: 'test-token-123' })
            }
          }
        }
      ]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    it('should POST to /member/login with credentials', () => {
      const mockResponse = { access_token: 'jwt-token' };

      service.login('user@test.com', 'password123', 1).subscribe(res => {
        expect(res).toEqual(mockResponse as any);
      });

      const req = httpMock.expectOne(`${API_URL}/member/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        email: 'user@test.com',
        password: 'password123',
        polling_order_id: 1
      });
      req.flush(mockResponse);
    });

    it('should include Content-Type application/json header', () => {
      service.login('user@test.com', 'pass', 1).subscribe();
      const req = httpMock.expectOne(`${API_URL}/member/login`);
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      req.flush({});
    });
  });

  describe('register', () => {
    it('should POST to /member/create with member data', () => {
      const mockResponse = { polling_order_member_id: 1 };

      service.register('Test User', 'user@test.com', 'password123', 1).subscribe(res => {
        expect(res).toEqual(mockResponse as any);
      });

      const req = httpMock.expectOne(`${API_URL}/member/create`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.name).toBe('Test User');
      expect(req.request.body.email).toBe('user@test.com');
      expect(req.request.body.polling_order_id).toBe(1);
      req.flush(mockResponse);
    });

    it('should include today\'s date in ISO format for pom_created_at', () => {
      const today = new Date().toISOString().split('T')[0];
      service.register('Test User', 'user@test.com', 'password123', 1).subscribe();
      const req = httpMock.expectOne(`${API_URL}/member/create`);
      expect(req.request.body.pom_created_at).toBe(today);
      req.flush({});
    });
  });

  describe('forceRegister', () => {
    it('should POST to /member/forcecreate with Bearer auth header', () => {
      const accessToken = 'my-access-token';
      service.forceRegister('Admin User', 'admin@test.com', 'password123', 1, accessToken).subscribe();

      const req = httpMock.expectOne(`${API_URL}/member/forcecreate`);
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.get('Authorization')).toBe('Bearer ' + accessToken);
      req.flush({});
    });

    it('should set approved to true and include authToken in body', () => {
      const accessToken = 'my-access-token';
      service.forceRegister('Admin User', 'admin@test.com', 'password123', 1, accessToken).subscribe();

      const req = httpMock.expectOne(`${API_URL}/member/forcecreate`);
      expect(req.request.body.authToken).toBe(accessToken);
      expect(req.request.body.approved).toBeTrue();
      req.flush({});
    });
  });

  describe('getPasswordToken', () => {
    it('should POST to /member/passwordToken with email and polling_order_id', () => {
      service.getPasswordToken('user@test.com', 1).subscribe();

      const req = httpMock.expectOne(`${API_URL}/member/passwordToken`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        email: 'user@test.com',
        polling_order_id: 1
      });
      req.flush({});
    });
  });

  describe('resetPassword', () => {
    it('should POST to /member/verify/:token using route query param', async () => {
      const observable = await service.resetPassword('user@test.com', 'newpassword');
      observable.subscribe();

      const req = httpMock.expectOne(`${API_URL}/member/verify/test-token-123`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        email: 'user@test.com',
        password: 'newpassword'
      });
      req.flush({});
    });
  });

  describe('updatePassword', () => {
    it('should PUT to /member/changePassword with Bearer auth header', () => {
      const accessToken = 'my-access-token';
      service.updatePassword('user@test.com', 'oldPass', 'newPass', 1, accessToken).subscribe();

      const req = httpMock.expectOne(`${API_URL}/member/changePassword`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.headers.get('Authorization')).toBe('Bearer ' + accessToken);
      req.flush({});
    });

    it('should send email, old password, new password, and pollingOrderId in body', () => {
      service.updatePassword('user@test.com', 'oldPass', 'newPass', 1, 'token').subscribe();

      const req = httpMock.expectOne(`${API_URL}/member/changePassword`);
      expect(req.request.body).toEqual({
        email: 'user@test.com',
        password: 'oldPass',
        newPassword: 'newPass',
        pollingOrderId: 1
      });
      req.flush({});
    });
  });
});
