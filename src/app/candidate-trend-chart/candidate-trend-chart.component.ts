import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType, TooltipItem } from 'chart.js';
import { Subscription } from 'rxjs';

import { PollingService } from '../services/polling.service';
import { CandidateTrendPoint } from '../interfaces/candidate-trend';

@Component({
  selector: 'app-candidate-trend-chart',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './candidate-trend-chart.component.html',
})
export class CandidateTrendChartComponent implements OnChanges {
  @Input() candidateId!: number;
  @Input() accessToken!: string;

  public loading = false;
  public trendPoints: CandidateTrendPoint[] = [];

  public readonly chartType: ChartType = 'line';

  public chartData: ChartData<'line', (number | null)[], string> = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Yes% rating',
        borderColor: '#B73225',
        backgroundColor: 'rgba(183, 50, 37, 0.15)',
        pointBackgroundColor: '#B73225',
        spanGaps: false,
        fill: false,
        tension: 0.2,
      },
    ],
  };

  public chartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        min: 0,
        max: 100,
        title: { display: true, text: 'Yes% rating' },
      },
    },
    plugins: {
      legend: { display: true },
      tooltip: {
        callbacks: {
          label: (item: TooltipItem<'line'>) => {
            const point = this.trendPoints[item.dataIndex];
            if (!point) {
              return '';
            }
            const rating = point.rating === null ? 'N/A' : `${point.rating}%`;
            return `${rating} (Yes ${point.yes} / Wait ${point.wait} / No ${point.no})`;
          },
        },
      },
    },
  };

  private subscription?: Subscription;

  constructor(private pollingService: PollingService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['candidateId'] && this.candidateId != null) {
      this.loadTrend();
    }
  }

  private loadTrend(): void {
    if (!this.candidateId || !this.accessToken) {
      return;
    }
    this.loading = true;
    this.subscription?.unsubscribe();
    this.subscription = this.pollingService.getCandidateTrend(this.candidateId, this.accessToken).subscribe({
      next: (points) => {
        this.trendPoints = points ?? [];
        this.chartData = {
          labels: this.trendPoints.map((p) => p.polling_name),
          datasets: [
            {
              ...this.chartData.datasets[0],
              data: this.trendPoints.map((p) => p.rating),
            },
          ],
        };
        this.loading = false;
      },
      error: () => {
        this.trendPoints = [];
        this.loading = false;
      },
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
