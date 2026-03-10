import { TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { of } from 'rxjs';

import { AppComponent } from './app.component';
import { StorageService } from './services/storage.service';
import { OrderPoliciesService } from './services/order-policies.service';

describe('AppComponent', () => {
  let storageServiceSpy: jasmine.SpyObj<StorageService>;
  let orderPoliciesServiceSpy: jasmine.SpyObj<OrderPoliciesService>;

  beforeEach(async () => {
    storageServiceSpy = jasmine.createSpyObj('StorageService', ['isLoggedIn', 'getMember', 'getPollingOrder', 'clean']);
    orderPoliciesServiceSpy = jasmine.createSpyObj('OrderPoliciesService', ['getOrderPolicyByPollingOrderId']);

    storageServiceSpy.isLoggedIn.and.returnValue(false);
    orderPoliciesServiceSpy.getOrderPolicyByPollingOrderId.and.returnValue(of(null));

    await TestBed.configureTestingModule({
      imports: [
        RouterModule.forRoot([]),
        AppComponent
      ],
      providers: [
        { provide: StorageService, useValue: storageServiceSpy },
        { provide: OrderPoliciesService, useValue: orderPoliciesServiceSpy }
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'polling'`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('polling');
  });
});
