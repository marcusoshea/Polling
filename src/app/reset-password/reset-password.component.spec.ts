import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { ResetPasswordComponent } from './reset-password.component';
import { AuthService } from '../services/auth.service';
import { StorageService } from '../services/storage.service';
import { PollingOrderService } from '../services/polling-order.service';

describe('ResetPasswordComponent', () => {
  let component: ResetPasswordComponent;
  let fixture: ComponentFixture<ResetPasswordComponent>;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['resetPassword']);
    const storageServiceSpy = jasmine.createSpyObj('StorageService', ['getMember', 'getPollingOrder', 'isLoggedIn']);
    const pollingOrderServiceSpy = jasmine.createSpyObj('PollingOrderService', ['getAllOrders']);

    pollingOrderServiceSpy.getAllOrders.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [ResetPasswordComponent, NoopAnimationsModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: StorageService, useValue: storageServiceSpy },
        { provide: PollingOrderService, useValue: pollingOrderServiceSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResetPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
