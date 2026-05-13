import { Component, signal, inject, DestroyRef, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { getFirestore, collection, query, orderBy, where } from 'firebase/firestore';
import { collectionData } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styles: [`
    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      background: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .stat-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .stat-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .stat-value {
      font-size: 1.75rem;
      font-weight: 700;
    }

    .stat-label {
      color: var(--text-secondary);
      font-size: 0.875rem;
    }

    .recent-section {
      background: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 1.5rem;
    }

    .section-title {
      font-size: 1.1rem;
      font-weight: 600;
      margin-bottom: 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .trade-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem 0;
      border-bottom: 1px solid var(--border-color);
    }

    .trade-item:last-child { border-bottom: none; }

    .trade-icon {
      width: 32px;
      height: 32px;
      background-color: var(--bg-color);
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .pnl-badge {
      padding: 0.2rem 0.6rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 700;
      white-space: nowrap;
    }

    .pnl-badge.profit {
      background: rgba(8, 153, 129, 0.12);
      color: var(--success-color);
    }

    .pnl-badge.loss {
      background: rgba(242, 54, 69, 0.12);
      color: var(--danger-color);
    }

    .empty-trades {
      text-align: center;
      padding: 2rem 0;
      color: var(--text-secondary);
      font-size: 0.9rem;
    }
  `]
})
export class DashboardComponent implements OnInit {
  private db = getFirestore();
  private auth = inject(Auth);
  private destroyRef = inject(DestroyRef);

  totalJournalEntries = signal(0);
  totalScripts = signal(0);
  totalFolders = signal(0);
  todayPnl = signal(0);
  recentTrades = signal<any[]>([]);

  statCards = computed(() => [
    {
      label: 'Journal Entries',
      value: String(this.totalJournalEntries()),
      icon: 'history_edu',
      color: 'rgba(52, 152, 219, 0.1)',
      iconColor: '#3498db'
    },
    {
      label: 'Total Scripts',
      value: String(this.totalScripts()),
      icon: 'code',
      color: 'rgba(255, 177, 26, 0.1)',
      iconColor: '#14b8a6'
    },
    {
      label: "Today's P&L",
      value: this.formatPnl(this.todayPnl()),
      icon: this.todayPnl() >= 0 ? 'trending_up' : 'trending_down',
      color: this.todayPnl() >= 0 ? 'rgba(8, 153, 129, 0.1)' : 'rgba(242, 54, 69, 0.1)',
      iconColor: this.todayPnl() >= 0 ? '#22c55e' : '#f23645'
    },
    {
      label: 'Total Folders',
      value: String(this.totalFolders()),
      icon: 'folder',
      color: 'rgba(155, 89, 182, 0.1)',
      iconColor: '#9b59b6'
    }
  ]);

  private parsePnl(pnl: string): number {
    if (!pnl) return 0;
    return parseFloat(pnl.replace(/[₹$,\s]/g, '')) || 0;
  }

  formatPnl(value: number): string {
    if (value === 0) return '0.00';
    const abs = Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return value > 0 ? `+${abs}` : `-${abs}`;
  }

  ngOnInit() {
    const uid = this.auth.currentUser!.uid;

    const journalQ = query(collection(this.db, 'journal'), where('uid', '==', uid), orderBy('date', 'desc'));
    collectionData(journalQ, { idField: 'id' })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((entries: any[]) => {
        this.totalJournalEntries.set(entries.length);
        const today = new Date().toDateString();
        const pnl = entries
          .filter(e => new Date(e.date).toDateString() === today)
          .reduce((sum, e) => sum + this.parsePnl(e.pnl), 0);
        this.todayPnl.set(pnl);
        this.recentTrades.set(entries.slice(0, 5));
      });

    collectionData(query(collection(this.db, 'scripts'), where('uid', '==', uid)), { idField: 'id' })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((scripts: any[]) => this.totalScripts.set(scripts.length));

    collectionData(query(collection(this.db, 'folders'), where('uid', '==', uid)), { idField: 'id' })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((folders: any[]) => this.totalFolders.set(folders.length));
  }
}
