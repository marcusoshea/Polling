import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogModule } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { CandidateImagesComponent } from './candidate-images.component';
import { MemberService } from '../services/member.service';
import { StorageService } from '../services/storage.service';
import { PollingOrderService } from '../services/polling-order.service';
import { CandidateService } from '../services/candidate.service';
import { PollingService } from '../services/polling.service';
import { AuthService } from '../services/auth.service';

describe('CandidateImagesComponent', () => {
  let component: CandidateImagesComponent;
  let fixture: ComponentFixture<CandidateImagesComponent>;

  beforeEach(async () => {
    const memberServiceSpy = jasmine.createSpyObj('MemberService', ['getAllOrderMembers']);
    const storageServiceSpy = jasmine.createSpyObj('StorageService', ['getMember', 'getPollingOrder', 'isLoggedIn']);
    const pollingOrderServiceSpy = jasmine.createSpyObj('PollingOrderService', ['getAllOrders']);
    const candidateServiceSpy = jasmine.createSpyObj('CandidateService', ['getAllCandidates', 'getAllCandidateImages', 'createCandidateImage', 'deleteCandidateImage']);
    const pollingServiceSpy = jasmine.createSpyObj('PollingService', ['getAllPollings']);
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['login']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate', 'getCurrentNavigation']);

    storageServiceSpy.getMember.and.returnValue({ access_token: 'token', memberId: 1, isOrderAdmin: true });
    storageServiceSpy.getPollingOrder.and.returnValue({ polling_order_id: 1, polling_order_name: 'Test' });
    candidateServiceSpy.getAllCandidateImages.and.returnValue(of([]));
    routerSpy.getCurrentNavigation.and.returnValue({
      extras: {
        state: {
          candidateName: 'Test Candidate',
          candidateId: 1
        }
      }
    });

    await TestBed.configureTestingModule({
      imports: [CandidateImagesComponent, NoopAnimationsModule, MatDialogModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MemberService, useValue: memberServiceSpy },
        { provide: StorageService, useValue: storageServiceSpy },
        { provide: PollingOrderService, useValue: pollingOrderServiceSpy },
        { provide: CandidateService, useValue: candidateServiceSpy },
        { provide: PollingService, useValue: pollingServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CandidateImagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
