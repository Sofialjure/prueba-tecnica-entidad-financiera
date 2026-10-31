import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom, of } from 'rxjs';
import { ConfirmDialog } from './confirm-dialog';
import { ConfirmService } from './confirm.service';

describe('ConfirmService', () => {
  const dialog = { open: vi.fn() };

  function serviceClosingWith(result: boolean | undefined) {
    dialog.open.mockReset().mockReturnValue({ afterClosed: () => of(result) });
    TestBed.configureTestingModule({ providers: [{ provide: MatDialog, useValue: dialog }] });
    return TestBed.inject(ConfirmService);
  }

  it('opens the dialog with the given data and emits true when confirmed', async () => {
    const service = serviceClosingWith(true);
    const data = { title: 'Cancelar cuenta', message: 'Esta acción no se puede deshacer' };

    expect(await firstValueFrom(service.confirm(data))).toBe(true);
    expect(dialog.open).toHaveBeenCalledWith(ConfirmDialog, { data, width: '420px' });
  });

  it('emits false when the dialog is dismissed', async () => {
    const service = serviceClosingWith(undefined);

    expect(await firstValueFrom(service.confirm({ title: 'x', message: 'y' }))).toBe(false);
  });
});
