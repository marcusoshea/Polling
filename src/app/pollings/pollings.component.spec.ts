import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogModule } from '@angular/material/dialog';
import { of } from 'rxjs';

import { PollingsComponent } from './pollings.component';
import { PollingService } from '../services/polling.service';
import { MemberService } from '../services/member.service';
import { StorageService } from '../services/storage.service';

describe('PollingsComponent', () => {
  let component: PollingsComponent;
  let fixture: ComponentFixture<PollingsComponent>;

  beforeEach(async () => {
    const pollingServiceSpy = jasmine.createSpyObj('PollingService', ['getCurrentPolling', 'getPollingSummary']);
    const memberServiceSpy = jasmine.createSpyObj('MemberService', ['getAllOrderMembers']);
    const storageServiceSpy = jasmine.createSpyObj('StorageService', ['getMember', 'getPollingOrder', 'isLoggedIn']);

    pollingServiceSpy.getCurrentPolling.and.returnValue(of(null));
    memberServiceSpy.getAllOrderMembers.and.returnValue(of([]));
    storageServiceSpy.getMember.and.returnValue({ access_token: 'token', memberId: 1, isOrderAdmin: false });
    storageServiceSpy.getPollingOrder.and.returnValue({ polling_order_id: 1, polling_order_name: 'Test' });

    await TestBed.configureTestingModule({
      imports: [PollingsComponent, NoopAnimationsModule, MatDialogModule],
      providers: [
        { provide: PollingService, useValue: pollingServiceSpy },
        { provide: MemberService, useValue: memberServiceSpy },
        { provide: StorageService, useValue: storageServiceSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PollingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
