import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth.html',
  styles: [`
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      width: 100%;
      background: radial-gradient(circle at center, #1e222d 0%, #0c0d10 100%);
    }

    .auth-card {
      width: 100%;
      max-width: 400px;
      padding: 2.5rem;
      background: rgba(19, 23, 34, 0.8);
      backdrop-filter: blur(20px);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.4);
    }

    .auth-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .auth-logo {
      width: 48px;
      height: 48px;
      background: var(--accent-color);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1rem;
      font-weight: 800;
      font-size: 1.5rem;
      color: #000;
    }

    .form-group {
      margin-bottom: 1.25rem;
    }

    .form-group label {
      display: block;
      font-size: 0.875rem;
      margin-bottom: 0.5rem;
      color: var(--text-secondary);
    }

    .form-group input {
      width: 100%;
      padding: 0.75rem 1rem;
      background: var(--bg-color);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      color: #fff;
      outline: none;
      transition: border-color 0.2s;
    }

    .form-group input:focus {
      border-color: var(--accent-color);
    }

    .primary-btn {
      width: 100%;
      padding: 0.875rem;
      background: var(--accent-color);
      color: #000;
      border: none;
      border-radius: 8px;
      font-weight: 700;
      cursor: pointer;
      margin-top: 1rem;
    }

    .switch-mode {
      text-align: center;
      margin-top: 1.5rem;
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .switch-mode span {
      color: var(--accent-color);
      cursor: pointer;
      font-weight: 600;
    }
  `]
})
export class AuthComponent {
  isLogin = signal(true);
  email = '';
  password = '';

  private auth = inject(Auth);
  private router = inject(Router);
  private toast = inject(ToastService);

  async handleAuth() {
    try {
      if (this.isLogin()) {
        await signInWithEmailAndPassword(this.auth, this.email, this.password);
      } else {
        await createUserWithEmailAndPassword(this.auth, this.email, this.password);
      }
      this.router.navigate(['/dashboard']);
    } catch (err: any) {
      this.toast.error(err.message);
    }
  }

  toggleMode() {
    this.isLogin.update(v => !v);
  }
}
