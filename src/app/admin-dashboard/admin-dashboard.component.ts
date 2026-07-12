import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, Subscription } from 'rxjs';

import { StorageService } from '../services/storage.service';
import { PollingService } from '../services/polling.service';
import { NotesService } from '../services/notes.service';
import { MemberService } from '../services/member.service';
import { Polling } from '../interfaces/polling';
import { PollingNote } from '../interfaces/polling-note';
import { OrderMember } from '../interfaces/order-member';

interface CandidateRating {
  name: string;
  rating: number;
  atOrAbove: boolean;
}

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'],
  imports: [CommonModule],
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  // Tile A — active polling
  public tileALoading = true;
  public tileAError = false;
  public hasActivePolling = false;
  public activePollingName = '';
  public activeEndDate: string | null = null;
  public daysRemaining: number | null = null;

  // Tile B — participation
  public tileBLoading = false;
  public tileBError = false;
  public tileBAvailable = false;
  public participatingMembers = 0;
  public activeMembers = 0;
  public participationRate = 0;
  public participationThreshold = 0;
  public onTrackToCertify = false;

  // Tile C — candidates vs bar
  public tileCLoading = false;
  public tileCError = false;
  public showTileC = false;
  public pollingScore = 0;
  public candidateRatings: CandidateRating[] = [];
  public candidateRatingsShown: CandidateRating[] = [];
  public candidateOverflow = 0;
  public atOrAboveCount = 0;
  public totalCandidates = 0;

  // Tile D — chronic non-voters (dismissible: some orders don't track this)
  public tileDLoading = true;
  public tileDError = false;
  public tileDHasHistory = false;
  public tileDPollingsCount = 0;
  public nonVoterNames: string[] = [];
  public nonVoterNamesShown: string[] = [];
  public nonVoterOverflow = 0;
  public hideNonVoters = false;

  private static readonly HIDE_NONVOTERS_KEY = 'dashboard-hide-nonvoters';
  private static readonly LIST_CAP = 8;

  // §2c: tiles with nothing to show are hidden entirely. Error states stay
  // visible so failures are never silently masked; loading renders briefly.
  get tileAVisible(): boolean {
    return this.tileALoading || this.tileAError || this.hasActivePolling;
  }
  get tileBVisible(): boolean {
    return this.tileBLoading || this.tileBError || (this.hasActivePolling && this.tileBAvailable);
  }
  get tileCVisible(): boolean {
    return this.showTileC && (this.tileCLoading || this.tileCError || this.candidateRatings.length > 0);
  }
  get tileDVisible(): boolean {
    return !this.hideNonVoters
      && (this.tileDLoading || this.tileDError || (this.tileDHasHistory && this.nonVoterNames.length > 0));
  }
  get tileEVisible(): boolean {
    return this.tileELoading || this.tileEError || this.pendingCount > 0;
  }

  // Tile E — pending registrations
  public tileELoading = true;
  public tileEError = false;
  public pendingCount = 0;
  public pendingNames: string[] = [];
  public pendingOverflow = 0;

  private static readonly PENDING_NAMES_SHOWN = 8;

  private subs: Subscription[] = [];

  constructor(
    private storageService: StorageService,
    private pollingService: PollingService,
    private notesService: NotesService,
    private memberService: MemberService,
  ) { }

  ngOnInit(): void {
    this.hideNonVoters = this.readHideNonVoters();
    const member = this.storageService.getMember();
    const pollingOrder = this.storageService.getPollingOrder();
    const token = member?.access_token;
    const orderId = pollingOrder?.polling_order_id;

    if (!token || orderId === undefined || orderId === null) {
      // No credentials — every tile shows its graceful fallback.
      this.tileALoading = false;
      this.tileAError = true;
      this.tileDLoading = false;
      this.tileDError = true;
      this.tileELoading = false;
      this.tileEError = true;
      return;
    }

    this.loadActivePolling(orderId, token);
    if (!this.hideNonVoters) {
      this.loadNonVoters(orderId, token);
    }
    this.loadPendingRegistrations(orderId, token);
  }

  public hideNonVotersTile(): void {
    this.hideNonVoters = true;
    try {
      window.localStorage.setItem(AdminDashboardComponent.HIDE_NONVOTERS_KEY, '1');
    } catch { /* storage unavailable: hide for this view only */ }
  }

  public showNonVotersTile(): void {
    this.hideNonVoters = false;
    try {
      window.localStorage.removeItem(AdminDashboardComponent.HIDE_NONVOTERS_KEY);
    } catch { /* ignore */ }
    const member = this.storageService.getMember();
    const pollingOrder = this.storageService.getPollingOrder();
    if (member?.access_token && pollingOrder?.polling_order_id != null) {
      this.loadNonVoters(pollingOrder.polling_order_id, member.access_token);
    }
  }

  private readHideNonVoters(): boolean {
    try {
      return window.localStorage.getItem(AdminDashboardComponent.HIDE_NONVOTERS_KEY) === '1';
    } catch {
      return false;
    }
  }

  private loadPendingRegistrations(orderId: number, token: string): void {
    this.tileELoading = true;
    this.safeSubscribe<OrderMember[]>(
      this.memberService.getAllOrderMembers(orderId, token),
      (members: OrderMember[]) => {
        this.tileELoading = false;
        // Same filter the Member Approval panel uses, so the count always matches it.
        const pending = (members ?? []).filter(m => m.approved === false);
        this.pendingCount = pending.length;
        this.pendingNames = pending
          .slice(0, AdminDashboardComponent.PENDING_NAMES_SHOWN)
          .map(m => m.name);
        this.pendingOverflow = this.pendingCount - this.pendingNames.length;
      },
      () => {
        this.tileELoading = false;
        this.tileEError = true;
      },
    );
  }

  /**
   * Defensive subscribe: only subscribes when the service returned a real
   * Observable. Guards against mocks/edge cases that return undefined so a
   * tile can never throw and block the admin page.
   */
  private safeSubscribe<T>(
    source: Observable<T> | undefined | null,
    next: (value: T) => void,
    error: () => void,
  ): void {
    if (!source || typeof (source as any).subscribe !== 'function') {
      error();
      return;
    }
    this.subs.push(source.subscribe({ next, error }));
  }

  private loadActivePolling(orderId: number, token: string): void {
    this.tileALoading = true;
    this.safeSubscribe<Polling>(
      this.pollingService.getCurrentPolling(orderId, token),
      (polling: Polling) => {
        this.tileALoading = false;
        if (polling && polling.end_date) {
          this.hasActivePolling = true;
          this.activePollingName = polling.polling_name;
          this.activeEndDate = polling.end_date;
          this.daysRemaining = this.computeDaysRemaining(polling.end_date);
          // A polling is active — load participation + candidates.
          this.loadInProcessReport(orderId, token);
        } else {
          this.hasActivePolling = false;
        }
      },
      () => {
        this.tileALoading = false;
        this.tileAError = true;
        this.hasActivePolling = false;
      },
    );
  }

  private computeDaysRemaining(endDate: string): number {
    const end = new Date(endDate).getTime();
    const today = new Date().getTime();
    return Math.ceil((end - today) / 86400000);
  }

  private loadInProcessReport(orderId: number, token: string): void {
    this.tileBLoading = true;
    this.safeSubscribe<any[]>(
      this.pollingService.getInProcessPollingReport(orderId, token) as any,
      (data: any[]) => {
        this.tileBLoading = false;
        if (!data || data[0]?.end_date === undefined) {
          // No active in-process polling per the report shape.
          this.tileBAvailable = false;
          return;
        }
        this.tileBAvailable = true;
        this.activeMembers = Number(data[1]?.active_members) || 0;
        this.participatingMembers = Number(data[2]?.member_participation) || 0;
        this.participationThreshold = Number(data[0]?.polling_order_polling_participation) || 0;
        this.participationRate = this.activeMembers > 0
          ? Number(((this.participatingMembers / this.activeMembers) * 100).toFixed(2))
          : 0;
        this.onTrackToCertify = this.participationRate >= this.participationThreshold;

        this.pollingScore = Number(data[0]?.polling_order_polling_score) || 0;
        const activePollingId = data[0]?.polling_id;
        if (this.pollingScore > 0 && activePollingId !== undefined && activePollingId !== null) {
          this.loadCandidateTotals(Number(activePollingId), token);
        }
      },
      () => {
        this.tileBLoading = false;
        this.tileBError = true;
        this.tileBAvailable = false;
      },
    );
  }

  private loadCandidateTotals(pollingId: number, token: string): void {
    this.showTileC = true;
    this.tileCLoading = true;
    this.safeSubscribe<PollingNote[]>(
      this.notesService.getPollingReportTotals(pollingId, token),
      (rows: PollingNote[]) => {
        this.tileCLoading = false;
        this.candidateRatings = this.buildCandidateRatings(rows || []);
        this.totalCandidates = this.candidateRatings.length;
        this.atOrAboveCount = this.candidateRatings.filter(c => c.atOrAbove).length;
        this.candidateRatingsShown = this.candidateRatings.slice(0, AdminDashboardComponent.LIST_CAP);
        this.candidateOverflow = this.candidateRatings.length - this.candidateRatingsShown.length;
      },
      () => {
        this.tileCLoading = false;
        this.tileCError = true;
      },
    );
  }

  /**
   * Pure: build per-candidate ratings from the totals rows.
   * Rating = Yes / (Yes + Wait + No) * 100 (matches the trend feature), guard 0.
   * Handles the `total` vs `TOTAL` property variance.
   */
  public buildCandidateRatings(rows: PollingNote[]): CandidateRating[] {
    const byName = new Map<string, { yes: number; wait: number; no: number }>();
    rows.forEach((row: any) => {
      const name = row?.name;
      if (!name) {
        return;
      }
      if (!byName.has(name)) {
        byName.set(name, { yes: 0, wait: 0, no: 0 });
      }
      const acc = byName.get(name)!;
      const total = parseInt(row?.total ?? row?.TOTAL, 10) || 0;
      switch (row?.vote) {
        case 'Yes':
          acc.yes += total;
          break;
        case 'Wait':
          acc.wait += total;
          break;
        case 'No':
          acc.no += total;
          break;
      }
    });

    const result: CandidateRating[] = [];
    byName.forEach((tallies, name) => {
      const denom = tallies.yes + tallies.wait + tallies.no;
      let rating = denom > 0 ? Number(((tallies.yes / denom) * 100).toFixed(2)) : 0;
      if (rating < 0 || isNaN(rating)) {
        rating = 0;
      }
      result.push({ name, rating, atOrAbove: rating >= this.pollingScore });
    });

    return result.sort((a, b) => b.rating - a.rating);
  }

  private loadNonVoters(orderId: number, token: string): void {
    this.tileDLoading = true;
    this.safeSubscribe<any>(
      this.pollingService.getMissingVotesReport(orderId, 3, token) as any,
      (data: any) => {
        this.tileDLoading = false;
        const entry = Array.isArray(data) ? data[0] : null;
        const pollings = entry?.pollings;
        if (!entry || !Array.isArray(pollings) || pollings.length === 0) {
          // Fewer than one polling of history.
          this.tileDHasHistory = false;
          return;
        }
        this.tileDHasHistory = true;
        this.tileDPollingsCount = pollings.length;
        const missing = Array.isArray(entry.missing_in_all) ? entry.missing_in_all : [];
        this.nonVoterNames = missing
          .map((m: any) => m?.name)
          .filter((n: any): n is string => !!n)
          .sort((a: string, b: string) => a.localeCompare(b));
        this.nonVoterNamesShown = this.nonVoterNames.slice(0, AdminDashboardComponent.LIST_CAP);
        this.nonVoterOverflow = this.nonVoterNames.length - this.nonVoterNamesShown.length;
      },
      () => {
        this.tileDLoading = false;
        this.tileDError = true;
        this.tileDHasHistory = false;
      },
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }
}
