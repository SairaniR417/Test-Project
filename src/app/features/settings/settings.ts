import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth';
import { Router } from '@angular/router';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './settings.html',
  styles: [`
    .settings-section {
      background: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .setting-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 0;
      border-bottom: 1px solid var(--border-color);
    }

    .setting-item:last-child { border-bottom: none; }

    .toggle {
      width: 40px;
      height: 20px;
      background: var(--border-color);
      border-radius: 20px;
      position: relative;
      cursor: pointer;
    }

    .toggle.active {
      background: var(--accent-color);
    }

    .toggle::after {
      content: "";
      position: absolute;
      width: 16px;
      height: 16px;
      background: #fff;
      border-radius: 50%;
      top: 2px;
      left: 2px;
      transition: transform 0.2s;
    }

    .toggle.active::after {
      transform: translateX(20px);
    }
  `]
})
export class SettingsComponent {
  notifications = true;
  themeService = inject(ThemeService);
  private authService = inject(AuthService);
  private router = inject(Router);

  async logout() {
    await this.authService.logout();
    this.router.navigate(['/auth']);
  }
}
