import { Component, signal, inject, DestroyRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { getFirestore, collection, query, orderBy, where } from 'firebase/firestore';
import { collectionData } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { NgApexchartsModule } from 'ng-apexcharts';
import { ThemeService } from '../../core/services/theme.service';

interface TradeStats {
  totalPnl: number;
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  profitFactor: number;
  maxDrawdown: number;
}

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  templateUrl: './analytics.html',
  styles: [`
    .analytics-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }

    .chart-container {
      background: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 1.5rem;
    }

    .stat-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .stat-sublabel {
      font-size: 0.72rem;
      color: var(--text-secondary);
      margin-top: 0.3rem;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 60vh;
      color: var(--text-secondary);
      text-align: center;
    }
  `]
})
export class AnalyticsComponent implements OnInit {
  private db = getFirestore();
  private auth = inject(Auth);
  private destroyRef = inject(DestroyRef);
  themeService = inject(ThemeService);

  stats = signal<TradeStats>({
    totalPnl: 0, totalTrades: 0, wins: 0, losses: 0,
    winRate: 0, profitFactor: 0, maxDrawdown: 0
  });

  equityChartOptions: any = null;
  winLossChartOptions: any = null;
  hasData = signal(false);

  private parsePnl(pnl: string): number {
    if (!pnl) return 0;
    return parseFloat(pnl.replace(/[₹$,\s]/g, '')) || 0;
  }

  formatProfitFactor(pf: number): string {
    return isFinite(pf) ? pf.toFixed(2) : '∞';
  }

  private computeAll(entries: any[]) {
    if (!entries.length) {
      this.hasData.set(false);
      return;
    }

    const sorted = [...entries].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const pnls = sorted.map(e => this.parsePnl(e.pnl));
    const totalPnl = pnls.reduce((s, v) => s + v, 0);
    const wins = pnls.filter(v => v > 0).length;
    const losses = pnls.filter(v => v < 0).length;
    const winRate = entries.length ? (wins / entries.length) * 100 : 0;

    const grossProfit = pnls.filter(v => v > 0).reduce((s, v) => s + v, 0);
    const grossLoss = Math.abs(pnls.filter(v => v < 0).reduce((s, v) => s + v, 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

    const equityValues: number[] = [];
    let equity = 0;
    let peak = 0;
    let maxDrawdown = 0;
    for (const pnl of pnls) {
      equity += pnl;
      equityValues.push(Math.round(equity * 100) / 100);
      if (equity > peak) peak = equity;
      const dd = peak > 0 ? ((peak - equity) / peak) * 100 : 0;
      if (dd > maxDrawdown) maxDrawdown = dd;
    }

    const labels = sorted.map(e =>
      e.displayDate || new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    );

    this.stats.set({ totalPnl, totalTrades: entries.length, wins, losses, winRate, profitFactor, maxDrawdown });
    this.hasData.set(true);

    const trendColor = totalPnl >= 0 ? '#22c55e' : '#f23645';

    this.equityChartOptions = {
      series: [{ name: 'Cumulative P&L', data: equityValues }],
      chart: { height: 300, type: 'area', background: 'transparent', toolbar: { show: false } },
      colors: [trendColor],
      theme: { mode: 'dark' },
      stroke: { curve: 'smooth', width: 2 },
      fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.3, opacityTo: 0.02 } },
      xaxis: {
        categories: labels,
        labels: { rotate: -30, style: { colors: '#888', fontSize: '11px' } },
        tickAmount: Math.min(labels.length, 8)
      },
      yaxis: { labels: { style: { colors: '#888' }, formatter: (v: number) => v.toFixed(0) } },
      grid: { borderColor: 'rgba(255,255,255,0.05)' },
      tooltip: { theme: 'dark', y: { formatter: (v: number) => v.toFixed(2) } }
    };

    const breakeven = entries.length - wins - losses;
    const pieData: number[] = [];
    const pieLabels: string[] = [];
    const pieColors: string[] = [];
    if (wins > 0)      { pieData.push(wins);      pieLabels.push('Wins');      pieColors.push('#22c55e'); }
    if (losses > 0)    { pieData.push(losses);    pieLabels.push('Losses');    pieColors.push('#f23645'); }
    if (breakeven > 0) { pieData.push(breakeven); pieLabels.push('Breakeven'); pieColors.push('#888888'); }

    this.winLossChartOptions = {
      series: pieData,
      chart: { height: 300, type: 'donut', background: 'transparent' },
      labels: pieLabels,
      colors: pieColors,
      theme: { mode: 'dark' },
      legend: { position: 'bottom', labels: { colors: '#aaa' } },
      dataLabels: { style: { colors: ['#000', '#fff', '#fff'] } },
      plotOptions: { pie: { donut: { size: '65%' } } },
      tooltip: { theme: 'dark' }
    };
  }

  ngOnInit() {
    const uid = this.auth.currentUser!.uid;
    const q = query(collection(this.db, 'journal'), where('uid', '==', uid), orderBy('date', 'desc'));
    collectionData(q, { idField: 'id' })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(entries => this.computeAll(entries));
  }
}
