import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { Auth, signOut, authState } from '@angular/fire/auth';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { ConfirmService } from '../../../core/services/confirm.service';

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
      z-index: 100;
    }

    .logo-container {
      padding: 2rem 1.5rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .logo-icon {
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, var(--accent-color), #0d9488);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #000;
      font-weight: bold;
    }

    .logo-text {
      font-size: 1.25rem;
      font-weight: 700;
      letter-spacing: -0.5px;
      color: var(--text-primary);
    }

    .nav-links {
      flex: 1;
      padding: 0 0.75rem;
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
    }

    .nav-item:hover {
      background-color: var(--surface-hover);
      color: var(--text-primary);
    }

    .nav-item.active {
      background-color: rgba(255, 177, 26, 0.1);
      color: var(--accent-color);
    }

    .nav-item i {
      font-size: 1.25rem;
    }

    .footer {
      padding: 1.5rem;
      border-top: 1px solid var(--border-color);
    }

    .user-profile {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background-color: var(--border-color);
    }
  `]
})
export class SidebarComponent {
  private auth = inject(Auth);
  private router = inject(Router);
  private confirm = inject(ConfirmService);

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

  async signOut() {
    const ok = await this.confirm.confirm('Sign Out', 'Are you sure you want to sign out?', 'Sign Out', true);
    if (ok) {
      await signOut(this.auth);
      this.router.navigate(['/auth']);
    }
  }

  menuItems = [
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
    { label: 'Folders', icon: 'folder', route: '/folders' },
    { label: 'Scripts', icon: 'code', route: '/scripts' },
    { label: 'Journal', icon: 'history_edu', route: '/journal' },
    { label: 'Analytics', icon: 'analytics', route: '/analytics' },
    { label: 'Settings', icon: 'settings', route: '/settings' }
  ];
}
