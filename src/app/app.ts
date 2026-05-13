import { Component, signal, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { SidebarComponent } from './shared/components/sidebar/sidebar';
import { HeaderComponent } from './shared/components/header/header';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs';
import { ThemeService } from './core/services/theme.service';
import { SidebarService } from './core/services/sidebar.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SidebarComponent, HeaderComponent, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('Trading Vault');
  isAuthPage = signal(false);
  private router = inject(Router);
  private _theme = inject(ThemeService);
  sidebar = inject(SidebarService);

  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.isAuthPage.set(event.url.includes('/auth'));
    });
  }
}
