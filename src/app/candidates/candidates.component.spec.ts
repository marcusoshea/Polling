import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { CandidatesComponent } from './candidates.component';
import { CandidateService } from '../services/candidate.service';
import { StorageService } from '../services/storage.service';
import { NotesService } from '../services/notes.service';

describe('CandidatesComponent', () => {
  let component: CandidatesComponent;
  let fixture: ComponentFixture<CandidatesComponent>;

  beforeEach(async () => {
    const candidateServiceSpy = jasmine.createSpyObj('CandidateService', ['getAllCandidates', 'getAllCandidateImages']);
    const storageServiceSpy = jasmine.createSpyObj('StorageService', ['getMember', 'getPollingOrder', 'isLoggedIn']);
    const notesServiceSpy = jasmine.createSpyObj('NotesService', ['getExternalNoteByCandidateId', 'getPollingNoteByCandidateId']);

    candidateServiceSpy.getAllCandidates.and.returnValue(of([]));
    candidateServiceSpy.getAllCandidateImages.and.returnValue(of([]));
    storageServiceSpy.getMember.and.returnValue({ access_token: 'token', memberId: 1 });
    storageServiceSpy.getPollingOrder.and.returnValue({ polling_order_id: 1, polling_order_name: 'Test' });

    await TestBed.configureTestingModule({
      imports: [CandidatesComponent, NoopAnimationsModule],
      providers: [
        { provide: CandidateService, useValue: candidateServiceSpy },
        { provide: StorageService, useValue: storageServiceSpy },
        { provide: NotesService, useValue: notesServiceSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CandidatesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
