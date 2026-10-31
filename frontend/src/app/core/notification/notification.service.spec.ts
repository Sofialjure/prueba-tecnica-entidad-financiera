import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  const snackBar = { open: vi.fn() };
  let service: NotificationService;

  beforeEach(() => {
    snackBar.open.mockReset();
    TestBed.configureTestingModule({ providers: [{ provide: MatSnackBar, useValue: snackBar }] });
    service = TestBed.inject(NotificationService);
  });

  it('shows success messages with the success style', () => {
    service.success('Cliente creado');

    expect(snackBar.open).toHaveBeenCalledWith('Cliente creado', 'Cerrar', {
      duration: 4000,
      panelClass: 'snackbar-success',
    });
  });

  it('keeps error messages on screen longer', () => {
    service.error('Saldo disponible insuficiente');

    expect(snackBar.open).toHaveBeenCalledWith('Saldo disponible insuficiente', 'Cerrar', {
      duration: 8000,
      panelClass: 'snackbar-error',
    });
  });
});
