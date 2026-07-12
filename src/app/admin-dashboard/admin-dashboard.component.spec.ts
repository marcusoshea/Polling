import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { AdminDashboardComponent } from './admin-dashboard.component';
import { PollingService } from '../services/polling.service';
import { NotesService } from '../services/notes.service';
import { StorageService } from '../services/storage.service';
import { MemberService } from '../services/member.service';

describe('AdminDashboardComponent', () => {
  let component: AdminDashboardComponent;
  let fixture: ComponentFixture<AdminDashboardComponent>;
  let pollingServiceSpy: jasmine.SpyObj<PollingService>;
  let notesServiceSpy: jasmine.SpyObj<NotesService>;
  let storageServiceSpy: jasmine.SpyObj<StorageService>;
  let memberServiceSpy: jasmine.SpyObj<MemberService>;

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
        { provide: MemberService, useValue: memberServiceSpy },
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
    memberServiceSpy = jasmine.createSpyObj('MemberService', ['getAllOrderMembers']);
    memberServiceSpy.getAllOrderMembers.and.returnValue(of([]));
    window.localStorage.removeItem('dashboard-hide-nonvoters');

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

    it('hides the tile entirely when there is no active polling (§2c)', () => {
      pollingServiceSpy.getCurrentPolling.and.returnValue(of({} as any));
      configure();

      expect(component.hasActivePolling).toBeFalse();
      expect(component.tileAVisible).toBeFalse();
      expect(fixture.nativeElement.textContent).not.toContain('Active Polling');
      expect(fixture.nativeElement.textContent).not.toContain('Participation');
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

    it('hides the tile when everyone has voted (§2c)', () => {
      pollingServiceSpy.getMissingVotesReport.and.returnValue(
        of([{ pollings: [{ polling_id: 1 }, { polling_id: 2 }], missing_in_all: [] }] as any),
      );
      configure();

      expect(component.tileDHasHistory).toBeTrue();
      expect(component.nonVoterNames.length).toBe(0);
      expect(component.tileDVisible).toBeFalse();
      expect(fixture.nativeElement.textContent).not.toContain('Chronic Non-Voters');
    });

    it('hides the tile when there is not enough polling history (§2c)', () => {
      pollingServiceSpy.getMissingVotesReport.and.returnValue(
        of([{ pollings: [], missing_in_all: [] }] as any),
      );
      configure();

      expect(component.tileDHasHistory).toBeFalse();
      expect(component.tileDVisible).toBeFalse();
      expect(fixture.nativeElement.textContent).not.toContain('Chronic Non-Voters');
    });
  });

  describe('Tile E — pending registrations', () => {
    function member(name: string, approved: boolean): any {
      return { polling_order_member_id: Math.random(), name, email: name + '@x', approved, removed: false };
    }

    it('counts and lists only unapproved members', () => {
      memberServiceSpy.getAllOrderMembers.and.returnValue(
        of([member('Approved Anna', true), member('Pending Pat', false), member('Pending Quinn', false)] as any),
      );
      configure();

      expect(component.pendingCount).toBe(2);
      expect(component.pendingNames).toEqual(['Pending Pat', 'Pending Quinn']);
      expect(fixture.nativeElement.textContent).toContain('2 awaiting approval');
      expect(fixture.nativeElement.textContent).toContain('Pending Pat');
      expect(fixture.nativeElement.textContent).not.toContain('Approved Anna');
    });

    it('hides the tile when there are no pending registrations (§2c)', () => {
      memberServiceSpy.getAllOrderMembers.and.returnValue(of([member('Anna', true)] as any));
      configure();

      expect(component.pendingCount).toBe(0);
      expect(component.tileEVisible).toBeFalse();
      expect(fixture.nativeElement.textContent).not.toContain('Pending Registrations');
    });

    it('caps the visible list at 8 names with a +N more line', () => {
      const many = Array.from({ length: 10 }, (_, i) => member('Pending ' + i, false));
      memberServiceSpy.getAllOrderMembers.and.returnValue(of(many as any));
      configure();

      expect(component.pendingCount).toBe(10);
      expect(component.pendingNames.length).toBe(8);
      expect(component.pendingOverflow).toBe(2);
      expect(fixture.nativeElement.textContent).toContain('+2 more');
    });

    it('renders the fallback without throwing when the member service errors', () => {
      memberServiceSpy.getAllOrderMembers.and.returnValue(throwError(() => new Error('boom')));
      expect(() => configure()).not.toThrow();

      expect(component.tileEError).toBeTrue();
      expect(fixture.nativeElement.textContent).toContain('Unable to load registrations.');
    });
  });

  describe('list caps (§2b amendment)', () => {
    it('caps Tile C at 8 candidates with a +N more line', () => {
      pollingServiceSpy.getCurrentPolling.and.returnValue(
        of({ polling_id: 42, polling_name: 'P', end_date: futureDate } as any),
      );
      pollingServiceSpy.getInProcessPollingReport.and.returnValue(of(buildInProcess({ score: 70 })));
      const rows: any[] = [];
      for (let i = 0; i < 10; i++) rows.push({ name: 'Cand ' + i, vote: 'Yes', total: '5' });
      notesServiceSpy.getPollingReportTotals.and.returnValue(of(rows as any));
      configure();

      expect(component.candidateRatings.length).toBe(10);
      expect(component.candidateRatingsShown.length).toBe(8);
      expect(component.candidateOverflow).toBe(2);
      expect(fixture.nativeElement.textContent).toContain('+2 more (see Report)');
    });

    it('caps Tile D at 8 non-voters with a +N more line', () => {
      const missing = Array.from({ length: 11 }, (_, i) => ({ name: 'Member ' + String(i).padStart(2, '0') }));
      pollingServiceSpy.getMissingVotesReport.and.returnValue(
        of([{ pollings: [{ polling_id: 1 }], missing_in_all: missing }] as any),
      );
      configure();

      expect(component.nonVoterNames.length).toBe(11);
      expect(component.nonVoterNamesShown.length).toBe(8);
      expect(component.nonVoterOverflow).toBe(3);
      expect(fixture.nativeElement.textContent).toContain('+3 more');
    });
  });

  describe('dismissible non-voters tile (§2b amendment)', () => {
    // The tile only renders with data (§2c), so give it a non-voter.
    beforeEach(() => {
      pollingServiceSpy.getMissingVotesReport.and.returnValue(
        of([{ pollings: [{ polling_id: 1 }], missing_in_all: [{ name: 'Zeb' }] }] as any),
      );
    });

    it('hides the tile, persists the preference, and offers a restore link', () => {
      configure();
      expect(fixture.nativeElement.textContent).toContain('Chronic Non-Voters');

      component.hideNonVotersTile();
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).not.toContain('Chronic Non-Voters');
      expect(fixture.nativeElement.textContent).toContain('Show non-voters tile');
      expect(window.localStorage.getItem('dashboard-hide-nonvoters')).toBe('1');
    });

    it('does not render the tile nor call the report when the preference is set', () => {
      window.localStorage.setItem('dashboard-hide-nonvoters', '1');
      configure();

      expect(component.hideNonVoters).toBeTrue();
      expect(fixture.nativeElement.textContent).not.toContain('Chronic Non-Voters');
      expect(pollingServiceSpy.getMissingVotesReport).not.toHaveBeenCalled();
    });

    it('restores the tile and loads the report via the show link', () => {
      window.localStorage.setItem('dashboard-hide-nonvoters', '1');
      configure();
      expect(pollingServiceSpy.getMissingVotesReport).not.toHaveBeenCalled();

      component.showNonVotersTile();
      fixture.detectChanges();

      expect(component.hideNonVoters).toBeFalse();
      expect(window.localStorage.getItem('dashboard-hide-nonvoters')).toBeNull();
      expect(pollingServiceSpy.getMissingVotesReport).toHaveBeenCalled();
      expect(fixture.nativeElement.textContent).toContain('Chronic Non-Voters');
    });
  });

  describe('quiet dashboard (§2c)', () => {
    it('renders no tiles at all when there is nothing to show', () => {
      // Defaults: no active polling, empty members, no polling history.
      configure();

      const text = fixture.nativeElement.textContent;
      expect(text).not.toContain('Active Polling');
      expect(text).not.toContain('Participation');
      expect(text).not.toContain('Candidates vs Bar');
      expect(text).not.toContain('Pending Registrations');
      expect(text).not.toContain('Chronic Non-Voters');
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
