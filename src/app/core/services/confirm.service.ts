import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/components/confirm-dialog/confirm-dialog';

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private dialog = inject(MatDialog);

  async confirm(title: string, message: string, confirmLabel = 'Delete', danger = true): Promise<boolean> {
    const data: ConfirmDialogData = { title, message, confirmLabel, danger };
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data,
      panelClass: 'confirm-dialog-panel',
      backdropClass: 'confirm-dialog-backdrop',
      disableClose: true
    });
    return (await firstValueFrom(ref.afterClosed())) === true;
  }
}
