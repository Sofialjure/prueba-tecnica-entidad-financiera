import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ConfirmDialog, ConfirmDialogData } from './confirm-dialog';

describe('ConfirmDialog', () => {
  const dialogRef = { close: vi.fn() };

  async function render(data: ConfirmDialogData) {
    dialogRef.close.mockReset();
    TestBed.configureTestingModule({
      imports: [ConfirmDialog],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialogRef, useValue: dialogRef },
      ],
    });
    const fixture = TestBed.createComponent(ConfirmDialog);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('shows the question and closes with true when confirmed', async () => {
    const element = await render({
      title: 'Eliminar cliente',
      message: '¿Desea eliminar a Ana María Gómez?',
      confirmText: 'Eliminar',
      destructive: true,
    });
    const [back, confirm] = Array.from(element.querySelectorAll('button'));

    expect(element.querySelector('h2')?.textContent).toBe('Eliminar cliente');
    expect(element.textContent).toContain('¿Desea eliminar a Ana María Gómez?');
    expect(confirm.textContent?.trim()).toBe('Eliminar');
    expect(confirm.classList).toContain('destructive');

    confirm.click();
    expect(dialogRef.close).toHaveBeenCalledWith(true);
    back.click();
    expect(dialogRef.close).toHaveBeenCalledWith(false);
  });

  it('uses a neutral "Confirmar" button by default', async () => {
    const element = await render({ title: 'Activar cuenta', message: '¿Desea activar la cuenta?' });
    const confirm = element.querySelectorAll('button')[1];

    expect(confirm.textContent?.trim()).toBe('Confirmar');
    expect(confirm.classList).not.toContain('destructive');
  });
});
