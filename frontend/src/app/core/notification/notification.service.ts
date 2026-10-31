import { inject, Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

/** Shown at the top, where the eye already is after pressing a button in a form or table. */
const POSITION: MatSnackBarConfig = { horizontalPosition: 'center', verticalPosition: 'top' };

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);

  success(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      ...POSITION,
      duration: 4000,
      panelClass: 'snackbar-success',
    });
  }

  error(message: string): void {
    this.snackBar.open(message, 'Cerrar', { ...POSITION, duration: 8000, panelClass: 'snackbar-error' });
  }
}
