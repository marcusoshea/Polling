import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { SimpleChange } from '@angular/core';

import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

import { CandidateTrendChartComponent } from './candidate-trend-chart.component';
import { PollingService } from '../services/polling.service';
import { CandidateTrendPoint } from '../interfaces/candidate-trend';

const TOKEN = 'test-bearer-token';

function triggerCandidateChange(component: CandidateTrendChartComponent, id: number): void {
  component.candidateId = id;
  component.ngOnChanges({
    candidateId: new SimpleChange(undefined, id, true),
  });
}

describe('CandidateTrendChartComponent', () => {
  let component: CandidateTrendChartComponent;
  let fixture: ComponentFixture<CandidateTrendChartComponent>;
  let pollingServiceSpy: jasmine.SpyObj<PollingService>;

  const points: CandidateTrendPoint[] = [
    { polling_id: 1, polling_name: 'Spring Polling', end_date: '2026-01-01', yes: 8, wait: 2, no: 1, abstain: 3, total: 14, rating: 72.73 },
    { polling_id: 2, polling_name: 'Summer Polling', end_date: '2026-06-01', yes: 5, wait: 0, no: 0, abstain: 2, total: 7, rating: null },
    { polling_id: 3, polling_name: 'Fall Polling', end_date: '2026-10-01', yes: 10, wait: 0, no: 0, abstain: 0, total: 10, rating: 100 },
  ];

  beforeEach(async () => {
    pollingServiceSpy = jasmine.createSpyObj('PollingService', ['getCandidateTrend']);
    pollingServiceSpy.getCandidateTrend.and.returnValue(of(points));

    await TestBed.configureTestingModule({
      imports: [CandidateTrendChartComponent],
      providers: [
        { provide: PollingService, useValue: pollingServiceSpy },
        provideCharts(withDefaultRegisterables()),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CandidateTrendChartComponent);
    component = fixture.componentInstance;
    component.accessToken = TOKEN;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call the service with the candidate id and token when candidateId changes', () => {
    triggerCandidateChange(component, 42);

    expect(pollingServiceSpy.getCandidateTrend).toHaveBeenCalledWith(42, TOKEN);
  });

  it('should map trend points to chart labels and data', () => {
    triggerCandidateChange(component, 42);

    expect(component.chartData.labels).toEqual(['Spring Polling', 'Summer Polling', 'Fall Polling']);
    expect(component.chartData.datasets[0].data).toEqual([72.73, null, 100]);
  });

  it('should render null ratings as gaps (spanGaps false)', () => {
    triggerCandidateChange(component, 42);

    const dataset = component.chartData.datasets[0];
    expect(dataset.data).toContain(null);
    expect(dataset.spanGaps).toBe(false);
  });

  it('should show empty state and no chart data when service returns an empty array', () => {
    pollingServiceSpy.getCandidateTrend.and.returnValue(of([]));

    triggerCandidateChange(component, 99);
    fixture.detectChanges();

    expect(component.trendPoints.length).toBe(0);

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('No polling history yet.');
    expect(el.querySelector('canvas')).toBeNull();
  });

  it('should render a chart canvas when there are trend points', () => {
    triggerCandidateChange(component, 42);
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('canvas')).not.toBeNull();
  });

  it('should clear points on error', () => {
    pollingServiceSpy.getCandidateTrend.and.returnValue(throwError(() => new Error('fail')));

    triggerCandidateChange(component, 42);

    expect(component.trendPoints.length).toBe(0);
    expect(component.loading).toBe(false);
  });
});
