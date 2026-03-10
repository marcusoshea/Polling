import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { of } from 'rxjs';

import { ReportComponent } from './report.component';
import { PollingService } from '../services/polling.service';
import { StorageService } from '../services/storage.service';
import { NotesService } from '../services/notes.service';
import { PollingReportService } from '../services/polling-report.service';

describe('ReportComponent', () => {
  let component: ReportComponent;
  let fixture: ComponentFixture<ReportComponent>;

  beforeEach(async () => {
    const pollingServiceSpy = jasmine.createSpyObj('PollingService', ['getInProcessPollingReport', 'getPollingSummary']);
    const storageServiceSpy = jasmine.createSpyObj('StorageService', ['getMember', 'getPollingOrder', 'isLoggedIn']);
    const notesServiceSpy = jasmine.createSpyObj('NotesService', ['getAllPollingNotesById', 'getPollingReportTotals']);
    const pollingReportServiceSpy = jasmine.createSpyObj('PollingReportService', ['getClosedPollingReport', 'getSpecificPollingReport']);

    storageServiceSpy.getMember.and.returnValue({ access_token: 'token', memberId: 1, isOrderAdmin: false });
    storageServiceSpy.getPollingOrder.and.returnValue({ polling_order_id: 1, polling_order_name: 'Test' });
    pollingReportServiceSpy.getClosedPollingReport.and.returnValue(of(null));

    await TestBed.configureTestingModule({
      imports: [ReportComponent, NoopAnimationsModule, RouterModule.forRoot([])],
      providers: [
        { provide: PollingService, useValue: pollingServiceSpy },
        { provide: StorageService, useValue: storageServiceSpy },
        { provide: NotesService, useValue: notesServiceSpy },
        { provide: PollingReportService, useValue: pollingReportServiceSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
