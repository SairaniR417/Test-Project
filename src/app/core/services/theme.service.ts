import { Injectable, signal, computed } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  isDark = signal<boolean>(this.loadFromStorage());

  chartTheme = computed(() => ({
    mode: (this.isDark() ? 'dark' : 'light') as 'dark' | 'light'
  }));

  constructor() {
    this.apply(this.isDark());
  }

  toggle() {
    const next = !this.isDark();
    this.isDark.set(next);
    this.apply(next);
    try { localStorage.setItem('theme', next ? 'dark' : 'light'); } catch {}
  }

  private loadFromStorage(): boolean {
    try {
      const saved = localStorage.getItem('theme');
      return saved ? saved === 'dark' : true;
    } catch {
      return true;
    }
  }

  private apply(dark: boolean) {
    if (dark) {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }
}
