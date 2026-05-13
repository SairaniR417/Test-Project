import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SidebarService {
  isCollapsed = signal(false);
  isMobileOpen = signal(false);

  toggleCollapse() { this.isCollapsed.update(v => !v); }
  toggleMobile()   { this.isMobileOpen.update(v => !v); }
  closeMobile()    { this.isMobileOpen.set(false); }
}
