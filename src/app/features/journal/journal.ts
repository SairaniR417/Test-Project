import { Component, signal, inject, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { getFirestore, collection, addDoc, updateDoc, doc, deleteDoc, query, orderBy, where } from 'firebase/firestore';
import { collectionData } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmService } from '../../core/services/confirm.service';

interface JournalStats {
  totalPnl: number;
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  bestTrade: number;
  worstTrade: number;
}

@Component({
  selector: 'app-journal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './journal.html',
  styles: [`
    .journal-container {
      display: flex;
      height: 100%;
      gap: 2rem;
    }

    .entries-sidebar {
      width: 350px;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      overflow-y: auto;
    }

    .entry-card {
      background: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 1.25rem;
      cursor: pointer;
      transition: all 0.2s;
      position: relative;
    }

    .entry-card:hover, .entry-card.active {
      border-color: var(--accent-color);
      background: var(--surface-hover);
    }

    .delete-entry-btn {
      position: absolute;
      top: 10px;
      right: 10px;
      opacity: 0;
      color: var(--text-secondary);
      transition: opacity 0.2s;
    }

    .entry-card:hover .delete-entry-btn {
      opacity: 1;
    }

    .delete-entry-btn:hover {
      color: var(--danger-color);
    }

    .entry-detail {
      flex: 1;
      background: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 2rem;
      overflow-y: auto;
    }

    .tag {
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.7rem;
      font-weight: 600;
    }

    .tag.profit { background: rgba(8, 153, 129, 0.1); color: var(--success-color); }
    .tag.loss { background: rgba(242, 54, 69, 0.1); color: var(--danger-color); }

    .btn-primary {
      background: var(--accent-color);
      color: #000;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-weight: 700;
      cursor: pointer;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .editable-field {
      width: 100%;
      background: transparent;
      border: 1px solid transparent;
      color: var(--text-primary);
      font-size: 1rem;
      padding: 0.5rem;
      border-radius: 4px;
      transition: border-color 0.2s;
    }

    .editable-field:focus {
      border-color: var(--accent-color);
      outline: none;
      background: rgba(255, 255, 255, 0.05);
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0,0,0,0.8);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: var(--surface-color);
      border: 1px solid var(--border-color);
      width: 500px;
      border-radius: 20px;
      padding: 2rem;
      box-shadow: 0 20px 40px rgba(0,0,0,0.4);
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-group label {
      display: block;
      color: var(--text-secondary);
      font-size: 0.8rem;
      margin-bottom: 0.5rem;
      text-transform: uppercase;
    }

    .form-input {
      width: 100%;
      background: var(--bg-color);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 0.75rem;
      color: var(--text-primary);
      font-size: 1rem;
    }

    .form-input:focus {
      border-color: var(--accent-color);
      outline: none;
    }

    @media (max-width: 768px) {
      .journal-container { flex-direction: column; height: auto; }

      .entries-sidebar {
        width: 100%;
        max-height: 300px;
        overflow-y: auto;
      }

      .entry-detail {
        min-height: 480px;
        overflow-y: visible;
      }
    }
  `]
})
export class JournalComponent implements OnInit {
  private db = getFirestore();
  auth = inject(Auth);
  private destroyRef = inject(DestroyRef);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);

  showModal = false;
  newEntryForm = {
    title: '',
    pnl: '',
    content: ''
  };

  entries$: Observable<any[]> | undefined;
  selectedEntry = signal<any>(null);
  stats = signal<JournalStats>({ totalPnl: 0, totalTrades: 0, wins: 0, losses: 0, winRate: 0, bestTrade: 0, worstTrade: 0 });

  private parsePnl(pnl: string): number {
    if (!pnl) return 0;
    return parseFloat(pnl.replace(/[₹$,\s]/g, '')) || 0;
  }

  private computeStats(entries: any[]) {
    const pnls = entries.map(e => this.parsePnl(e.pnl));
    const totalPnl = pnls.reduce((sum, v) => sum + v, 0);
    const wins = pnls.filter(v => v > 0).length;
    const losses = pnls.filter(v => v < 0).length;
    const winRate = entries.length ? (wins / entries.length) * 100 : 0;
    const bestTrade = pnls.length ? Math.max(...pnls) : 0;
    const worstTrade = pnls.length ? Math.min(...pnls) : 0;
    this.stats.set({ totalPnl, totalTrades: entries.length, wins, losses, winRate, bestTrade, worstTrade });
  }

  ngOnInit() {
    const uid = this.auth.currentUser!.uid;
    const col = collection(this.db, 'journal');
    const own$ = collectionData(query(col, where('uid', '==', uid), orderBy('date', 'desc')), { idField: 'id' });

    this.entries$ = own$;

    const targetId = this.route.snapshot.queryParamMap.get('id');

    own$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(entries => {
      if (entries.length > 0 && !this.selectedEntry()) {
        const target = targetId ? entries.find((e: any) => e.id === targetId) : null;
        this.selectedEntry.set(target ?? entries[0]);
      }
      this.computeStats(entries);
    });
  }

  openModal() {
    this.showModal = true;
    this.newEntryForm = { title: '', pnl: '', content: '' };
  }

  closeModal() {
    this.showModal = false;
  }

  async saveNewEntry() {
    if (!this.newEntryForm.title) return;

    const newEntry: any = {
      uid: this.auth.currentUser!.uid,
      date: new Date().toISOString(),
      displayDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      title: this.newEntryForm.title,
      pnl: this.newEntryForm.pnl || '$0.00',
      status: this.newEntryForm.pnl?.startsWith('-') ? 'loss' : 'profit',
      content: this.newEntryForm.content || '',
      emotions: 'Neutral',
      lessons: ''
    };

    try {
      const journalCol = collection(this.db, 'journal');
      await addDoc(journalCol, newEntry);
      this.closeModal();
    } catch (e: any) {
      console.error('Error saving to Firestore:', e);
      this.toast.error('Failed to save entry: ' + (e?.message ?? 'Unknown error'));
    }
  }

  async updateEntry() {
    const entry = this.selectedEntry();
    if (!entry || !entry.id) return;

    try {
      const entryRef = doc(this.db, 'journal', entry.id);
      await updateDoc(entryRef, {
        content: entry.content,
        emotions: entry.emotions,
        lessons: entry.lessons
      });
    } catch (e) {
      console.error('Error updating entry:', e);
    }
  }

  async deleteEntry(event: Event, entry: any) {
    event.stopPropagation();
    const ok = await this.confirm.confirm(
      'Delete Journal Entry',
      'Are you sure you want to delete this entry? This action cannot be undone.'
    );
    if (ok) {
      try {
        const entryRef = doc(this.db, 'journal', entry.id);
        await deleteDoc(entryRef);
        if (this.selectedEntry()?.id === entry.id) {
          this.selectedEntry.set(null);
        }
      } catch (e: any) {
        console.error('Error deleting entry:', e);
        this.toast.error('Failed to delete entry: ' + (e?.message ?? 'Unknown error'));
      }
    }
  }

  selectEntry(entry: any) {
    this.selectedEntry.set(entry);
  }
}
