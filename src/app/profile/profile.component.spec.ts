import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { ProfileComponent } from './profile.component';
import { MemberService } from '../services/member.service';
import { StorageService } from '../services/storage.service';
import { AuthService } from '../services/auth.service';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;

  beforeEach(async () => {
    const memberServiceSpy = jasmine.createSpyObj('MemberService', ['updateProfile']);
    const storageServiceSpy = jasmine.createSpyObj('StorageService', ['getMember', 'getPollingOrder', 'isLoggedIn', 'clean']);
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['updatePassword']);

    storageServiceSpy.getMember.and.returnValue({
      access_token: 'token',
      memberId: 1,
      name: 'Test User',
      email: 'test@test.com',
      pollingOrder: 1,
      active: true
    });

    await TestBed.configureTestingModule({
      imports: [ProfileComponent, NoopAnimationsModule],
      providers: [
        { provide: MemberService, useValue: memberServiceSpy },
        { provide: StorageService, useValue: storageServiceSpy },
        { provide: AuthService, useValue: authServiceSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
