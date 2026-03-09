import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { RouterModule } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { LoginComponent } from './login.component';
import { AuthService } from '../services/auth.service';
import { StorageService } from '../services/storage.service';
import { PollingOrderService } from '../services/polling-order.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let storageServiceSpy: jasmine.SpyObj<StorageService>;
  let pollingOrderServiceSpy: jasmine.SpyObj<PollingOrderService>;

  const mockOrders = [
    { polling_order_id: 2, polling_order_name: 'Order B' },
    { polling_order_id: 1, polling_order_name: 'Order A' }
  ];

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['login']);
    storageServiceSpy = jasmine.createSpyObj('StorageService', ['isLoggedIn', 'saveMember', 'savePollingOrder']);
    pollingOrderServiceSpy = jasmine.createSpyObj('PollingOrderService', ['getAllOrders']);

    storageServiceSpy.isLoggedIn.and.returnValue(false);
    pollingOrderServiceSpy.getAllOrders.and.returnValue(of(mockOrders));

    await TestBed.configureTestingModule({
      imports: [
        LoginComponent,
        RouterModule.forRoot([]),
        NoopAnimationsModule
      ],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: StorageService, useValue: storageServiceSpy },
        { provide: PollingOrderService, useValue: pollingOrderServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load and sort polling orders alphabetically', () => {
      expect(component.pollingOrderList.length).toBe(2);
      expect(component.pollingOrderList[0].polling_order_name).toBe('Order A');
      expect(component.pollingOrderList[1].polling_order_name).toBe('Order B');
    });

    it('should set isLoggedIn to true when user is already in session', () => {
      storageServiceSpy.isLoggedIn.and.returnValue(true);
      component.ngOnInit();
      expect(component.isLoggedIn).toBeTrue();
    });

    it('should set isLoggedIn to false when user is not in session', () => {
      storageServiceSpy.isLoggedIn.and.returnValue(false);
      component.ngOnInit();
      expect(component.isLoggedIn).toBeFalse();
    });

    it('should set errorMessage when getAllOrders fails', () => {
      pollingOrderServiceSpy.getAllOrders.and.returnValue(
        throwError(() => ({ error: { message: 'Server error' } }))
      );
      component.ngOnInit();
      expect(component.errorMessage).toBe('Server error');
    });
  });

  describe('onSubmit', () => {
    const mockPollingOrder = { polling_order_id: 1, polling_order_name: 'Test Order' };

    beforeEach(() => {
      component.form = {
        email: 'user@test.com',
        password: 'password123',
        pollingOrder: mockPollingOrder
      };
    });

    it('should call authService.login with form credentials', () => {
      authServiceSpy.login.and.returnValue(of({}));
      spyOn(location, 'replace');

      component.onSubmit();

      expect(authServiceSpy.login).toHaveBeenCalledWith('user@test.com', 'password123', mockPollingOrder.polling_order_id as any);
    });

    it('should save member and polling order to storage on successful login', () => {
      const mockResponse = { access_token: 'jwt-token', name: 'Test User' };
      authServiceSpy.login.and.returnValue(of(mockResponse));
      spyOn(location, 'replace');

      component.onSubmit();

      expect(storageServiceSpy.saveMember).toHaveBeenCalledWith(mockResponse);
      expect(storageServiceSpy.savePollingOrder).toHaveBeenCalledWith(mockPollingOrder);
    });

    it('should set isLoggedIn to true and isLoginFailed to false on success', () => {
      authServiceSpy.login.and.returnValue(of({ access_token: 'jwt-token' }));
      spyOn(location, 'replace');

      component.onSubmit();

      expect(component.isLoggedIn).toBeTrue();
      expect(component.isLoginFailed).toBeFalse();
    });

    it('should set isLoginFailed and errorMessage on failed login', () => {
      authServiceSpy.login.and.returnValue(
        throwError(() => ({ error: { message: 'Invalid credentials' } }))
      );

      component.onSubmit();

      expect(component.isLoginFailed).toBeTrue();
      expect(component.errorMessage).toBe('Invalid credentials');
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from both subscriptions on destroy', () => {
      const sub1Spy = jasmine.createSpyObj('Subscription', ['unsubscribe']);
      const sub2Spy = jasmine.createSpyObj('Subscription', ['unsubscribe']);
      component.subscript1 = sub1Spy;
      component.subscript2 = sub2Spy;

      component.ngOnDestroy();

      expect(sub1Spy.unsubscribe).toHaveBeenCalled();
      expect(sub2Spy.unsubscribe).toHaveBeenCalled();
    });

    it('should not throw when subscriptions are undefined', () => {
      component.subscript1 = undefined;
      component.subscript2 = undefined;
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});
