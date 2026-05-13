import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  styles: [`
    .dialog-wrapper {
      background: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 2rem;
      min-width: 340px;
      max-width: 420px;
    }

    .dialog-icon {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: rgba(242, 54, 69, 0.12);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1.25rem;
    }

    .dialog-icon i {
      font-size: 1.5rem;
      color: var(--danger-color);
    }

    h2 {
      margin: 0 0 0.5rem;
      font-size: 1.1rem;
      font-weight: 700;
      color: #fff;
    }

    p {
      margin: 0 0 1.75rem;
      color: var(--text-secondary);
      font-size: 0.9rem;
      line-height: 1.5;
    }

    .actions {
      display: flex;
      gap: 0.75rem;
      justify-content: flex-end;
    }

    .btn-cancel {
      padding: 0.6rem 1.25rem;
      background: transparent;
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-cancel:hover {
      border-color: var(--text-secondary);
    }

    .btn-confirm {
      padding: 0.6rem 1.25rem;
      background: var(--danger-color);
      border: none;
      color: #fff;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-confirm.accent {
      background: var(--accent-color);
      color: #000;
    }

    .btn-confirm:hover {
      opacity: 0.85;
    }
  `],
  template: `
    <div class="dialog-wrapper">
      <div class="dialog-icon">
        <i class="material-icons-round">{{ data.danger === false ? 'help_outline' : 'delete_outline' }}</i>
      </div>
      <h2>{{ data.title }}</h2>
      <p>{{ data.message }}</p>
      <div class="actions">
        <button class="btn-cancel" (click)="cancel()">Cancel</button>
        <button
          class="btn-confirm"
          [class.accent]="data.danger === false"
          (click)="confirm()">
          {{ data.confirmLabel || 'Delete' }}
        </button>
      </div>
    </div>
  `
})
export class ConfirmDialogComponent {
  data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<ConfirmDialogComponent>);

  confirm() { this.dialogRef.close(true); }
  cancel()  { this.dialogRef.close(false); }
}
