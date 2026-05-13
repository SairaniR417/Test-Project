import { Injectable, signal, inject } from '@angular/core';
import { Auth, user, User } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  user$ = user(this.auth);
  currentUser = signal<User | null>(null);

  constructor() {
    this.user$.subscribe(u => this.currentUser.set(u));
  }

  logout() {
    return this.auth.signOut();
  }
}
