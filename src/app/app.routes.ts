import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Auth, user } from '@angular/fire/auth';
import { map, take } from 'rxjs';
import { Router } from '@angular/router';

const authGuard = () => {
  const auth = inject(Auth);
  const router = inject(Router);
  return user(auth).pipe(
    take(1),
    map(u => !!u || router.createUrlTree(['/auth']))
  );
};

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'folders',
    loadComponent: () => import('./features/folders/folders').then(m => m.FoldersComponent),
    canActivate: [authGuard]
  },
  {
    path: 'scripts',
    loadComponent: () => import('./features/scripts/scripts').then(m => m.ScriptsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'journal',
    loadComponent: () => import('./features/journal/journal').then(m => m.JournalComponent),
    canActivate: [authGuard]
  },
  {
    path: 'analytics',
    loadComponent: () => import('./features/analytics/analytics').then(m => m.AnalyticsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'settings',
    loadComponent: () => import('./features/settings/settings').then(m => m.SettingsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'auth',
    loadComponent: () => import('./features/auth/auth').then(m => m.AuthComponent)
  },
  { path: '**', redirectTo: 'dashboard' }
];
