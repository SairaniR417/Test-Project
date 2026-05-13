import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private snackBar = inject(MatSnackBar);

  success(message: string) {
    this.snackBar.open(message, '✕', {
      duration: 3000,
      panelClass: ['toast-success'],
      horizontalPosition: 'right',
      verticalPosition: 'bottom'
    });
  }

  error(message: string) {
    this.snackBar.open(message, '✕', {
      duration: 5000,
      panelClass: ['toast-error'],
      horizontalPosition: 'right',
      verticalPosition: 'bottom'
    });
  }
}
