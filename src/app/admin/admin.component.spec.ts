import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { MatDialogModule } from '@angular/material/dialog';
import { ReactiveFormsModule } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { AdminComponent } from './admin.component';
import { MemberService } from '../services/member.service';
import { StorageService } from '../services/storage.service';
import { PollingOrderService } from '../services/polling-order.service';
import { CandidateService } from '../services/candidate.service';
import { PollingService } from '../services/polling.service';
import { AuthService } from '../services/auth.service';
import { PollingReportService } from '../services/polling-report.service';
import { NotesService } from '../services/notes.service';
import { OrderPoliciesService } from '../services/order-policies.service';

describe('AdminComponent', () => {
  let component: AdminComponent;
  let fixture: ComponentFixture<AdminComponent>;

  beforeEach(async () => {
    const memberServiceSpy = jasmine.createSpyObj('MemberService', ['getAllOrderMembers', 'updateMember', 'removeMember']);
    const storageServiceSpy = jasmine.createSpyObj('StorageService', ['getMember', 'getPollingOrder', 'isLoggedIn', 'clean']);
    const pollingOrderServiceSpy = jasmine.createSpyObj('PollingOrderService', ['getAllOrders', 'updatePollingOrder']);
    const candidateServiceSpy = jasmine.createSpyObj('CandidateService', ['getAllCandidates', 'createCandidate', 'removeCandidate', 'editCandidate', 'getAllCandidateImages']);
    const pollingServiceSpy = jasmine.createSpyObj('PollingService', ['getAllPollings', 'getCurrentPolling', 'createPolling', 'removePolling', 'getMissingVotesReport', 'createPollingCandidates', 'editPolling']);
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['forceRegister']);
    const pollingReportServiceSpy = jasmine.createSpyObj('PollingReportService', ['getClosedPollingReport', 'getSpecificPollingReport']);
    const notesServiceSpy = jasmine.createSpyObj('NotesService', ['getAllPollingNotesById']);
    const orderPoliciesServiceSpy = jasmine.createSpyObj('OrderPoliciesService', ['getOrderPolicyByPollingOrderId', 'createOrderPolicy', 'updateOrderPolicy', 'deleteOrderPolicy']);

    storageServiceSpy.getMember.and.returnValue({
      access_token: 'token',
      memberId: 1,
      isOrderAdmin: true
    });
    storageServiceSpy.getPollingOrder.and.returnValue({
      polling_order_id: 1,
      polling_order_name: 'Test Order',
      polling_order_admin: 1,
      polling_order_admin_assistant: 1
    });
    memberServiceSpy.getAllOrderMembers.and.returnValue(of([]));
    candidateServiceSpy.getAllCandidates.and.returnValue(of([]));
    pollingServiceSpy.getAllPollings.and.returnValue(of([]));
    orderPoliciesServiceSpy.getOrderPolicyByPollingOrderId.and.returnValue(of(null));

    await TestBed.configureTestingModule({
      imports: [
        AdminComponent,
        NoopAnimationsModule,
        RouterModule.forRoot([]),
        MatDialogModule,
        ReactiveFormsModule
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MemberService, useValue: memberServiceSpy },
        { provide: StorageService, useValue: storageServiceSpy },
        { provide: PollingOrderService, useValue: pollingOrderServiceSpy },
        { provide: CandidateService, useValue: candidateServiceSpy },
        { provide: PollingService, useValue: pollingServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: PollingReportService, useValue: pollingReportServiceSpy },
        { provide: NotesService, useValue: notesServiceSpy },
        { provide: OrderPoliciesService, useValue: orderPoliciesServiceSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
