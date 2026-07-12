import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { CandidatesComponent } from './candidates.component';
import { CandidateService } from '../services/candidate.service';
import { StorageService } from '../services/storage.service';
import { NotesService } from '../services/notes.service';
import { PollingService } from '../services/polling.service';
import { Candidate } from '../interfaces/candidate';

function makeCandidate(overrides: Partial<Candidate> = {}): Candidate {
  return {
    candidate_id: 1,
    name: 'Cand',
    link: '',
    polling_order_id: 1,
    watch_list: false,
    ...overrides
  };
}

describe('CandidatesComponent', () => {
  let component: CandidatesComponent;
  let fixture: ComponentFixture<CandidatesComponent>;

  beforeEach(async () => {
    const candidateServiceSpy = jasmine.createSpyObj('CandidateService', ['getAllCandidates', 'getAllCandidateImages']);
    const storageServiceSpy = jasmine.createSpyObj('StorageService', ['getMember', 'getPollingOrder', 'isLoggedIn']);
    const notesServiceSpy = jasmine.createSpyObj('NotesService', ['getExternalNoteByCandidateId', 'getPollingNoteByCandidateId']);
    // Needed by the trend chart rendered when a candidate is selected.
    const pollingServiceSpy = jasmine.createSpyObj('PollingService', ['getCandidateTrend']);

    candidateServiceSpy.getAllCandidates.and.returnValue(of([]));
    candidateServiceSpy.getAllCandidateImages.and.returnValue(of([]));
    notesServiceSpy.getExternalNoteByCandidateId.and.returnValue(of([]));
    notesServiceSpy.getPollingNoteByCandidateId.and.returnValue(of([]));
    pollingServiceSpy.getCandidateTrend.and.returnValue(of([]));
    storageServiceSpy.getMember.and.returnValue({ access_token: 'token', memberId: 1 });
    storageServiceSpy.getPollingOrder.and.returnValue({ polling_order_id: 1, polling_order_name: 'Test' });

    await TestBed.configureTestingModule({
      imports: [CandidatesComponent, NoopAnimationsModule],
      providers: [
        { provide: CandidateService, useValue: candidateServiceSpy },
        { provide: StorageService, useValue: storageServiceSpy },
        { provide: NotesService, useValue: notesServiceSpy },
        { provide: PollingService, useValue: pollingServiceSpy }
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

  describe('watch-list filter', () => {
    beforeEach(() => {
      component.dataSourceCandidates.data = [
        makeCandidate({ candidate_id: 1, name: 'Alice', watch_list: true }),
        makeCandidate({ candidate_id: 2, name: 'Bob', watch_list: false }),
        makeCandidate({ candidate_id: 3, name: 'Alfred', watch_list: false })
      ];
      fixture.detectChanges();
    });

    it('renders a labelled "Watch list only" checkbox next to the search input', () => {
      const el: HTMLElement = fixture.nativeElement;
      const checkbox = el.querySelector('#watch-list-only');
      expect(checkbox).toBeTruthy();
      expect(checkbox?.getAttribute('aria-label')).toBe('Show watch list candidates only');
      expect(el.querySelector('label[for="watch-list-only"]')?.textContent).toContain('Watch list only');
    });

    it('toggle on filters filteredData down to watch-list rows only', () => {
      component.watchListOnly = true;
      component.toggleWatchListOnly();

      expect(component.dataSourceCandidates.filteredData.length).toBe(1);
      expect(component.dataSourceCandidates.filteredData[0].name).toBe('Alice');
      // Filtering never mutates the underlying data.
      expect(component.dataSourceCandidates.data.length).toBe(3);
    });

    it('combines with the text filter (watch-list AND name match)', () => {
      component.watchListOnly = true;
      component.toggleWatchListOnly();
      component.applyFilter({ target: { value: 'al' } } as unknown as Event);

      // 'al' matches Alice and Alfred, but only Alice is on the watch list.
      expect(component.dataSourceCandidates.filteredData.length).toBe(1);
      expect(component.dataSourceCandidates.filteredData[0].name).toBe('Alice');

      // Text alone (toggle off) matches both again.
      component.watchListOnly = false;
      component.toggleWatchListOnly();
      expect(component.dataSourceCandidates.filteredData.map(c => c.name).sort()).toEqual(['Alfred', 'Alice']);
    });

    it('toggle off + empty text shows all rows (predicate handles the empty case)', () => {
      component.watchListOnly = true;
      component.toggleWatchListOnly();
      expect(component.dataSourceCandidates.filteredData.length).toBe(1);

      component.watchListOnly = false;
      component.applyFilter({ target: { value: '' } } as unknown as Event);
      expect(component.dataSourceCandidates.filteredData.length).toBe(3);
    });
  });

  describe('column sorting', () => {
    const alice = makeCandidate({ candidate_id: 1, name: 'alice', watch_list: false });
    const bob = makeCandidate({ candidate_id: 2, name: 'Bob', watch_list: true });
    const carol = makeCandidate({ candidate_id: 3, name: 'Carol', watch_list: false });

    beforeEach(() => {
      component.dataSourceCandidates.data = [carol, alice, bob];
      fixture.detectChanges();
    });

    it('attaches MatSort to the data source with a default of name asc', () => {
      const sort = component.dataSourceCandidates.sort;
      expect(sort).toBeTruthy();
      expect(sort!.active).toBe('name');
      expect(sort!.direction).toBe('asc');
    });

    it('sorts by name asc/desc case-insensitively', () => {
      const sort = component.dataSourceCandidates.sort!;
      sort.active = 'name';
      sort.direction = 'asc';
      let sorted = component.dataSourceCandidates.sortData([carol, alice, bob], sort);
      expect(sorted.map(c => c.name)).toEqual(['alice', 'Bob', 'Carol']);

      sort.direction = 'desc';
      sorted = component.dataSourceCandidates.sortData([carol, alice, bob], sort);
      expect(sorted.map(c => c.name)).toEqual(['Carol', 'Bob', 'alice']);
    });

    it('watch_list sortingDataAccessor maps the boolean to 1/0 so checked rows group together', () => {
      expect(component.dataSourceCandidates.sortingDataAccessor(makeCandidate({ watch_list: true }), 'watch_list')).toBe(1);
      expect(component.dataSourceCandidates.sortingDataAccessor(makeCandidate({ watch_list: false }), 'watch_list')).toBe(0);

      const sort = component.dataSourceCandidates.sort!;
      sort.active = 'watch_list';
      sort.direction = 'desc';
      const sorted = component.dataSourceCandidates.sortData([carol, alice, bob], sort);
      expect(sorted[0].name).toBe('Bob'); // the only watch-list row floats to the top
    });

    it('re-attaches sort after viewing a candidate and navigating back (setter ViewChild)', () => {
      // Enter the candidate detail view: the list table (and its MatSort) is destroyed.
      component.viewCandidate({ name: 'Bob', link: '', candidate_id: 2, watch_list: true });
      fixture.detectChanges();
      expect(component.candidateSelected).toBeTrue();

      // Navigate back: the table is recreated and the setter re-attaches a fresh MatSort.
      component.resetCandidates();
      fixture.detectChanges();
      expect(component.candidateSelected).toBeFalse();
      expect(component.dataSourceCandidates.sort).toBeTruthy();
      expect(component.dataSourceCandidates.sort!.active).toBe('name');
    });
  });
});
