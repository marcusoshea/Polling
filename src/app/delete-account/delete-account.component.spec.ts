import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteAccountComponent } from './delete-account.component';
import { AuthService } from '../services/auth.service';
import { StorageService } from '../services/storage.service';
import { PollingOrderService } from '../services/polling-order.service';

describe('DeleteAccountComponent', () => {
  let component: DeleteAccountComponent;
  let fixture: ComponentFixture<DeleteAccountComponent>;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['login', 'register']);
    const storageServiceSpy = jasmine.createSpyObj('StorageService', ['getMember', 'getPollingOrder', 'isLoggedIn']);
    const pollingOrderServiceSpy = jasmine.createSpyObj('PollingOrderService', ['getAllOrders']);

    await TestBed.configureTestingModule({
      imports: [DeleteAccountComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: StorageService, useValue: storageServiceSpy },
        { provide: PollingOrderService, useValue: pollingOrderServiceSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeleteAccountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
