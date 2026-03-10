import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { ForgotPasswordComponent } from './forgot-password.component';
import { AuthService } from '../services/auth.service';
import { StorageService } from '../services/storage.service';
import { PollingOrderService } from '../services/polling-order.service';

describe('ForgotPasswordComponent', () => {
  let component: ForgotPasswordComponent;
  let fixture: ComponentFixture<ForgotPasswordComponent>;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getPasswordToken']);
    const storageServiceSpy = jasmine.createSpyObj('StorageService', ['getMember', 'getPollingOrder', 'isLoggedIn']);
    const pollingOrderServiceSpy = jasmine.createSpyObj('PollingOrderService', ['getAllOrders']);

    pollingOrderServiceSpy.getAllOrders.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [ForgotPasswordComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: StorageService, useValue: storageServiceSpy },
        { provide: PollingOrderService, useValue: pollingOrderServiceSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ForgotPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
