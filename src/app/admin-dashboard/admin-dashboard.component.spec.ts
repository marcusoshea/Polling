import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { AdminDashboardComponent } from './admin-dashboard.component';
import { PollingService } from '../services/polling.service';
import { NotesService } from '../services/notes.service';
import { StorageService } from '../services/storage.service';

describe('AdminDashboardComponent', () => {
  let component: AdminDashboardComponent;
  let fixture: ComponentFixture<AdminDashboardComponent>;
  let pollingServiceSpy: jasmine.SpyObj<PollingService>;
  let notesServiceSpy: jasmine.SpyObj<NotesService>;
  let storageServiceSpy: jasmine.SpyObj<StorageService>;

  // A future end date so days-remaining is positive.
  const futureDate = new Date(Date.now() + 5 * 86400000).toISOString();

  function buildInProcess(overrides: any = {}): any[] {
    return [
      {
        polling_id: 42,
        polling_name: 'Spring Polling',
        end_date: futureDate,
        start_date: new Date().toISOString(),
        polling_order_polling_participation: overrides.participation ?? 50,
        polling_order_polling_score: overrides.score ?? 70,
      },
      { active_members: overrides.active ?? 10 },
      { member_participation: overrides.participating ?? 8 },
    ];
  }

  function configure(): void {
    TestBed.configureTestingModule({
      imports: [AdminDashboardComponent, NoopAnimationsModule],
      providers: [
        { provide: PollingService, useValue: pollingServiceSpy },
        { provide: NotesService, useValue: notesServiceSpy },
        { provide: StorageService, useValue: storageServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    pollingServiceSpy = jasmine.createSpyObj('PollingService', [
      'getCurrentPolling',
      'getInProcessPollingReport',
      'getMissingVotesReport',
    ]);
    notesServiceSpy = jasmine.createSpyObj('NotesService', ['getPollingReportTotals']);
    storageServiceSpy = jasmine.createSpyObj('StorageService', ['getMember', 'getPollingOrder']);

    storageServiceSpy.getMember.and.returnValue({ access_token: 'token', isOrderAdmin: true } as any);
    storageServiceSpy.getPollingOrder.and.returnValue({ polling_order_id: 1, polling_order_name: 'Test' } as any);

    // Sensible defaults; individual tests override.
    pollingServiceSpy.getCurrentPolling.and.returnValue(of({} as any));
    pollingServiceSpy.getInProcessPollingReport.and.returnValue(of([{}] as any));
    pollingServiceSpy.getMissingVotesReport.and.returnValue(of([{ pollings: [], missing_in_all: [] }] as any));
    notesServiceSpy.getPollingReportTotals.and.returnValue(of([]));
  });

  it('should create', () => {
    configure();
    expect(component).toBeTruthy();
  });

  describe('Tile A — active polling', () => {
    it('shows active polling name and days remaining when a polling is active', () => {
      pollingServiceSpy.getCurrentPolling.and.returnValue(
        of({ polling_id: 42, polling_name: 'Spring Polling', end_date: futureDate } as any),
      );
      pollingServiceSpy.getInProcessPollingReport.and.returnValue(of(buildInProcess()));
      configure();

      expect(component.hasActivePolling).toBeTrue();
      expect(component.activePollingName).toBe('Spring Polling');
      expect(component.daysRemaining).toBeGreaterThan(0);
      expect(fixture.nativeElement.textContent).toContain('Spring Polling');
    });

    it('shows the no-active-polling state when getCurrentPolling returns empty', () => {
      pollingServiceSpy.getCurrentPolling.and.returnValue(of({} as any));
      configure();

      expect(component.hasActivePolling).toBeFalse();
      expect(fixture.nativeElement.textContent).toContain('No active polling in progress.');
    });
  });

  describe('Tile B — participation', () => {
    it('computes the rate and flags on-track when at/above threshold', () => {
      pollingServiceSpy.getCurrentPolling.and.returnValue(
        of({ polling_id: 42, polling_name: 'P', end_date: futureDate } as any),
      );
      pollingServiceSpy.getInProcessPollingReport.and.returnValue(
        of(buildInProcess({ active: 10, participating: 8, participation: 50 })),
      );
      configure();

      expect(component.participationRate).toBe(80);
      expect(component.onTrackToCertify).toBeTrue();
      expect(fixture.nativeElement.textContent).toContain('8 of 10 = 80%');
      expect(fixture.nativeElement.textContent).toContain('On track to certify');
    });

    it('flags below-threshold when the rate is under the threshold', () => {
      pollingServiceSpy.getCurrentPolling.and.returnValue(
        of({ polling_id: 42, polling_name: 'P', end_date: futureDate } as any),
      );
      pollingServiceSpy.getInProcessPollingReport.and.returnValue(
        of(buildInProcess({ active: 10, participating: 3, participation: 50 })),
      );
      configure();

      expect(component.participationRate).toBe(30);
      expect(component.onTrackToCertify).toBeFalse();
      expect(fixture.nativeElement.textContent).toContain('Below certification threshold (50%)');
    });

    it('guards divide-by-zero when there are no active members', () => {
      pollingServiceSpy.getCurrentPolling.and.returnValue(
        of({ polling_id: 42, polling_name: 'P', end_date: futureDate } as any),
      );
      pollingServiceSpy.getInProcessPollingReport.and.returnValue(
        of(buildInProcess({ active: 0, participating: 0 })),
      );
      configure();

      expect(component.participationRate).toBe(0);
    });
  });

  describe('Tile C — candidates vs bar', () => {
    it('classifies candidates at/above and below the score', () => {
      pollingServiceSpy.getCurrentPolling.and.returnValue(
        of({ polling_id: 42, polling_name: 'P', end_date: futureDate } as any),
      );
      pollingServiceSpy.getInProcessPollingReport.and.returnValue(of(buildInProcess({ score: 70 })));
      notesServiceSpy.getPollingReportTotals.and.returnValue(
        of([
          { name: 'Alice', vote: 'Yes', total: '8' },
          { name: 'Alice', vote: 'No', total: '2' },
          { name: 'Bob', vote: 'Yes', total: '3' },
          { name: 'Bob', vote: 'No', total: '7' },
        ] as any),
      );
      configure();

      expect(component.showTileC).toBeTrue();
      const alice = component.candidateRatings.find(c => c.name === 'Alice')!;
      const bob = component.candidateRatings.find(c => c.name === 'Bob')!;
      expect(alice.rating).toBe(80);
      expect(alice.atOrAbove).toBeTrue();
      expect(bob.rating).toBe(30);
      expect(bob.atOrAbove).toBeFalse();
      expect(component.atOrAboveCount).toBe(1);
      expect(component.totalCandidates).toBe(2);
      expect(fixture.nativeElement.textContent).toContain('1 of 2 at/above 70%');
    });

    it('handles the TOTAL (uppercase) property variant', () => {
      pollingServiceSpy.getCurrentPolling.and.returnValue(
        of({ polling_id: 42, polling_name: 'P', end_date: futureDate } as any),
      );
      pollingServiceSpy.getInProcessPollingReport.and.returnValue(of(buildInProcess({ score: 70 })));
      notesServiceSpy.getPollingReportTotals.and.returnValue(
        of([
          { name: 'Alice', vote: 'Yes', TOTAL: '9' },
          { name: 'Alice', vote: 'No', TOTAL: '1' },
        ] as any),
      );
      configure();

      const alice = component.candidateRatings.find(c => c.name === 'Alice')!;
      expect(alice.rating).toBe(90);
    });

    it('hides Tile C entirely when polling_order_polling_score is 0', () => {
      pollingServiceSpy.getCurrentPolling.and.returnValue(
        of({ polling_id: 42, polling_name: 'P', end_date: futureDate } as any),
      );
      pollingServiceSpy.getInProcessPollingReport.and.returnValue(of(buildInProcess({ score: 0 })));
      configure();

      expect(component.showTileC).toBeFalse();
      expect(notesServiceSpy.getPollingReportTotals).not.toHaveBeenCalled();
      expect(fixture.nativeElement.textContent).not.toContain('Candidates vs Bar');
    });
  });

  describe('Tile D — chronic non-voters', () => {
    it('lists non-voters from missing_in_all', () => {
      pollingServiceSpy.getMissingVotesReport.and.returnValue(
        of([
          {
            pollings: [{ polling_id: 1 }, { polling_id: 2 }, { polling_id: 3 }],
            missing_in_all: [
              { name: 'Zeb', polling_order_member_id: 5 },
              { name: 'Amy', polling_order_member_id: 6 },
            ],
          },
        ] as any),
      );
      configure();

      expect(component.tileDHasHistory).toBeTrue();
      expect(component.tileDPollingsCount).toBe(3);
      expect(component.nonVoterNames).toEqual(['Amy', 'Zeb']);
      expect(fixture.nativeElement.textContent).toContain('2 missed all of the last 3 pollings');
      expect(fixture.nativeElement.textContent).toContain('Amy');
    });

    it('shows the everyone-voted state when missing_in_all is empty', () => {
      pollingServiceSpy.getMissingVotesReport.and.returnValue(
        of([{ pollings: [{ polling_id: 1 }, { polling_id: 2 }], missing_in_all: [] }] as any),
      );
      configure();

      expect(component.tileDHasHistory).toBeTrue();
      expect(component.nonVoterNames.length).toBe(0);
      expect(fixture.nativeElement.textContent).toContain(
        'Everyone has voted in at least one of the last 2 pollings.',
      );
    });

    it('shows the not-enough-history state when there are no pollings', () => {
      pollingServiceSpy.getMissingVotesReport.and.returnValue(
        of([{ pollings: [], missing_in_all: [] }] as any),
      );
      configure();

      expect(component.tileDHasHistory).toBeFalse();
      expect(fixture.nativeElement.textContent).toContain('Not enough polling history.');
    });
  });

  describe('graceful failure', () => {
    it('renders Tile A fallback without throwing when getCurrentPolling errors', () => {
      pollingServiceSpy.getCurrentPolling.and.returnValue(throwError(() => new Error('boom')));
      expect(() => configure()).not.toThrow();

      expect(component.tileAError).toBeTrue();
      expect(fixture.nativeElement.textContent).toContain('Unable to load active polling.');
    });

    it('renders Tile D fallback without throwing when getMissingVotesReport errors', () => {
      pollingServiceSpy.getMissingVotesReport.and.returnValue(throwError(() => new Error('boom')));
      expect(() => configure()).not.toThrow();

      expect(component.tileDError).toBeTrue();
      expect(fixture.nativeElement.textContent).toContain('Unable to load non-voter report.');
    });
  });
});
