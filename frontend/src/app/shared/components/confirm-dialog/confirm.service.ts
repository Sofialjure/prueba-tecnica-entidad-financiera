import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { map, Observable } from 'rxjs';
import { ConfirmDialog, ConfirmDialogData } from './confirm-dialog';

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private readonly dialog = inject(MatDialog);

  /** Emits true only when the user presses the confirm button; closing the dialog counts as false. */
  confirm(data: ConfirmDialogData): Observable<boolean> {
    return this.dialog
      .open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, { data, width: '420px' })
      .afterClosed()
      .pipe(map((confirmed) => confirmed === true));
  }
}
