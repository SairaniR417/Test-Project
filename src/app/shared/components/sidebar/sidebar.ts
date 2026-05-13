import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { Auth, signOut, authState } from '@angular/fire/auth';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { ConfirmService } from '../../../core/services/confirm.service';
import { SidebarService } from '../../../core/services/sidebar.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styles: [`
    :host {
      width: var(--sidebar-width);
      height: 100%;
      background-color: var(--surface-color);
      border-right: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      z-index: 500;
      transition: width 0.25s ease;
      overflow: hidden;
      flex-shrink: 0;
    }

    :host.collapsed {
      width: 64px;
    }

    .logo-container {
      padding: 1.25rem 1rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      min-height: 64px;
    }

    .logo-left {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      overflow: hidden;
      min-width: 0;
    }

    .logo-icon {
      width: 32px;
      height: 32px;
      min-width: 32px;
      background: linear-gradient(135deg, var(--accent-color), #0d9488);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-weight: bold;
      font-size: 0.875rem;
    }

    .logo-text {
      font-size: 1.1rem;
      font-weight: 700;
      letter-spacing: -0.5px;
      color: var(--text-primary);
      white-space: nowrap;
      opacity: 1;
      transition: opacity 0.15s ease;
    }

    :host.collapsed .logo-text {
      opacity: 0;
      pointer-events: none;
    }

    .collapse-btn {
      background: none;
      border: none;
      color: var(--text-secondary);
      cursor: pointer;
      padding: 0.3rem;
      border-radius: 6px;
      display: flex;
      align-items: center;
      flex-shrink: 0;
      transition: color 0.2s, background 0.2s;
    }

    .collapse-btn:hover {
      color: var(--text-primary);
      background: var(--surface-hover);
    }

    .nav-links {
      flex: 1;
      padding: 0 0.75rem;
      transition: padding 0.25s ease;
    }

    :host.collapsed .nav-links {
      padding: 0 0.5rem;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.875rem 1rem;
      border-radius: 8px;
      color: var(--text-secondary);
      text-decoration: none;
      margin-bottom: 0.25rem;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s, color 0.2s, padding 0.25s, justify-content 0.25s;
      white-space: nowrap;
      overflow: hidden;
    }

    :host.collapsed .nav-item {
      justify-content: center;
      padding: 0.875rem;
      gap: 0;
    }

    .nav-item:hover {
      background-color: var(--surface-hover);
      color: var(--text-primary);
    }

    .nav-item.active {
      background-color: color-mix(in srgb, var(--accent-color) 12%, transparent);
      color: var(--accent-color);
    }

    .nav-item i {
      font-size: 1.25rem;
      flex-shrink: 0;
    }

    .nav-label {
      opacity: 1;
      transition: opacity 0.15s ease;
    }

    :host.collapsed .nav-label {
      opacity: 0;
      width: 0;
      overflow: hidden;
    }

    .footer {
      padding: 1.5rem;
      border-top: 1px solid var(--border-color);
      transition: padding 0.25s ease;
    }

    :host.collapsed .footer {
      padding: 1rem 0.5rem;
    }

    .sign-out-btn {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      background: transparent;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      color: var(--text-secondary);
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 600;
      transition: border-color 0.2s, color 0.2s, padding 0.25s, justify-content 0.25s;
      overflow: hidden;
      white-space: nowrap;
    }

    :host.collapsed .sign-out-btn {
      justify-content: center;
      padding: 0.75rem;
      gap: 0;
    }

    .sign-out-btn:hover {
      border-color: var(--danger-color);
      color: var(--danger-color);
    }

    .btn-label {
      opacity: 1;
      transition: opacity 0.15s ease;
    }

    :host.collapsed .btn-label {
      opacity: 0;
      width: 0;
      overflow: hidden;
    }
  `]
})
export class SidebarComponent {
  private auth = inject(Auth);
  private router = inject(Router);
  private confirm = inject(ConfirmService);
  sidebar = inject(SidebarService);

  private firstName = toSignal(
    authState(this.auth).pipe(
      map(user => {
        const email = user?.email ?? '';
        const username = email.split('@')[0];
        const name = username.split(/[._]/)[0].replace(/\d+/g, '');
        return name ? name.charAt(0).toUpperCase() + name.slice(1) : 'Vault';
      })
    ),
    { initialValue: 'Vault' }
  );

  displayName = this.firstName;
  logoLetter = toSignal(
    authState(this.auth).pipe(
      map(user => (user?.email?.charAt(0) ?? 'V').toUpperCase())
    ),
    { initialValue: 'V' }
  );

  menuItems = [
    { label: 'Dashboard', icon: 'dashboard',   route: '/dashboard' },
    { label: 'Folders',   icon: 'folder',      route: '/folders'   },
    { label: 'Scripts',   icon: 'code',        route: '/scripts'   },
    { label: 'Journal',   icon: 'history_edu', route: '/journal'   },
    { label: 'Analytics', icon: 'analytics',   route: '/analytics' },
    { label: 'Settings',  icon: 'settings',    route: '/settings'  }
  ];

  navigate(route: string) {
    this.sidebar.closeMobile();
    this.router.navigate([route]);
  }

  async signOut() {
    const ok = await this.confirm.confirm('Sign Out', 'Are you sure you want to sign out?', 'Sign Out', true);
    if (ok) {
      await signOut(this.auth);
      this.router.navigate(['/auth']);
    }
  }
}
