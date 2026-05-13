import { Component, signal, inject, OnInit, DestroyRef, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { getFirestore, collection, query, orderBy } from 'firebase/firestore';
import { collectionData } from '@angular/fire/firestore';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './header.html',
  styles: [`
    :host {
      height: 64px;
      background-color: var(--bg-color);
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 2rem;
      position: relative;
      z-index: 200;
    }

    .search-wrapper {
      position: relative;
      width: 300px;
    }

    .search-bar {
      display: flex;
      align-items: center;
      background-color: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: 6px;
      padding: 0.5rem 1rem;
      gap: 0.5rem;
      transition: border-color 0.2s;
    }

    .search-bar:focus-within {
      border-color: var(--accent-color);
    }

    .search-bar input {
      background: none;
      border: none;
      color: var(--text-primary);
      outline: none;
      width: 100%;
      font-size: 0.875rem;
    }

    .search-bar input::placeholder {
      color: var(--text-secondary);
    }

    .clear-btn {
      background: none;
      border: none;
      color: var(--text-secondary);
      cursor: pointer;
      padding: 0;
      display: flex;
      align-items: center;
      font-size: 1rem;
    }

    .clear-btn:hover { color: var(--text-primary); }

    .dropdown {
      position: absolute;
      top: calc(100% + 6px);
      left: 0;
      width: 100%;
      background: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.3);
      overflow: hidden;
      z-index: 300;
    }

    .dropdown-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1rem;
      cursor: pointer;
      border-bottom: 1px solid var(--border-color);
      transition: background 0.15s;
      gap: 0.75rem;
    }

    .dropdown-item:last-child { border-bottom: none; }

    .dropdown-item:hover { background: var(--surface-hover); }

    .dropdown-item-title {
      font-size: 0.875rem;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
    }

    .dropdown-item-date {
      font-size: 0.75rem;
      color: var(--text-secondary);
      white-space: nowrap;
    }

    .pnl-chip {
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.15rem 0.5rem;
      border-radius: 20px;
      white-space: nowrap;
    }

    .pnl-chip.profit { background: rgba(34,197,94,0.12); color: #22c55e; }
    .pnl-chip.loss   { background: rgba(242,54,69,0.12);  color: #f23645; }

    .no-results {
      padding: 1rem;
      text-align: center;
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .actions {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .upload-btn {
      background: var(--accent-color);
      color: #fff;
      border: none;
      padding: 0.5rem 1.1rem;
      border-radius: 6px;
      font-weight: 600;
      font-size: 0.875rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      transition: opacity 0.2s;
    }

    .upload-btn:hover { opacity: 0.85; }
  `]
})
export class HeaderComponent implements OnInit {
  private db = getFirestore();
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private el = inject(ElementRef);

  searchQuery = signal('');
  showDropdown = signal(false);
  private allEntries: any[] = [];
  filteredEntries = signal<any[]>([]);

  ngOnInit() {
    const q = query(collection(this.db, 'journal'), orderBy('date', 'desc'));
    collectionData(q, { idField: 'id' })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((entries: any[]) => {
        this.allEntries = entries;
      });
  }

  onSearch(value: string) {
    this.searchQuery.set(value);
    const q = value.trim().toLowerCase();
    if (!q) {
      this.filteredEntries.set([]);
      this.showDropdown.set(false);
      return;
    }
    const results = this.allEntries
      .filter(e => e.title?.toLowerCase().includes(q))
      .slice(0, 6);
    this.filteredEntries.set(results);
    this.showDropdown.set(true);
  }

  selectEntry(entry: any) {
    this.showDropdown.set(false);
    this.searchQuery.set('');
    this.filteredEntries.set([]);
    this.router.navigate(['/journal'], { queryParams: { id: entry.id } });
  }

  clearSearch() {
    this.searchQuery.set('');
    this.filteredEntries.set([]);
    this.showDropdown.set(false);
  }

  goToUpload() {
    this.router.navigate(['/folders']);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.el.nativeElement.contains(event.target)) {
      this.showDropdown.set(false);
    }
  }
}
