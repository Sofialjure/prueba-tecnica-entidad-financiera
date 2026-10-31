import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { AccountService } from '../account.service';
import { CHECKING_ACCOUNT, SAVINGS_ACCOUNT } from '../testing/accounts.fixtures';
import { OpenAccountDialog } from './open-account-dialog';

describe('OpenAccountDialog', () => {
  const accountService = { open: vi.fn() };
  const dialogRef = { close: vi.fn() };

  async function render() {
    TestBed.configureTestingModule({
      imports: [OpenAccountDialog],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { customerId: 3, customerName: 'Laura Restrepo' } },
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: AccountService, useValue: accountService },
      ],
    });
    const fixture = TestBed.createComponent(OpenAccountDialog);
    await fixture.whenStable();
    return fixture;
  }

  const element = (fixture: ComponentFixture<OpenAccountDialog>) => fixture.nativeElement as HTMLElement;
  const typeButton = (fixture: ComponentFixture<OpenAccountDialog>, title: string) =>
    Array.from(element(fixture).querySelectorAll<HTMLButtonElement>('.type')).find((button) =>
      button.textContent?.includes(title),
    )!;

  async function submit(fixture: ComponentFixture<OpenAccountDialog>) {
    element(fixture).querySelector<HTMLButtonElement>('button[type=submit]')!.click();
    await fixture.whenStable();
  }

  beforeEach(() => vi.resetAllMocks());

  it('opens a savings account by default, without overdraft field', async () => {
    accountService.open.mockReturnValue(of(SAVINGS_ACCOUNT));
    const fixture = await render();

    expect(element(fixture).textContent).toContain('Laura Restrepo');
    expect(typeButton(fixture, 'Ahorros').getAttribute('aria-checked')).toBe('true');
    expect(element(fixture).querySelector('input[formControlName="overdraftLimit"]')).toBeNull();

    await submit(fixture);

    expect(accountService.open).toHaveBeenCalledWith({
      customerId: 3,
      accountType: 'SAVINGS',
      overdraftLimit: 0,
      gmfExempt: false,
    });
    expect(dialogRef.close).toHaveBeenCalledWith(SAVINGS_ACCOUNT);
  });

  it('opens a GMF-exempt checking account with an overdraft limit', async () => {
    accountService.open.mockReturnValue(of(CHECKING_ACCOUNT));
    const fixture = await render();

    typeButton(fixture, 'Corriente').click();
    await fixture.whenStable();
    const overdraft = element(fixture).querySelector<HTMLInputElement>('input[formControlName="overdraftLimit"]')!;
    overdraft.value = '500000';
    overdraft.dispatchEvent(new Event('input'));
    element(fixture).querySelector<HTMLButtonElement>('mat-slide-toggle button')!.click();
    await submit(fixture);

    expect(accountService.open).toHaveBeenCalledWith({
      customerId: 3,
      accountType: 'CHECKING',
      overdraftLimit: 500000,
      gmfExempt: true,
    });
  });

  it('resets the overdraft when going back to savings', async () => {
    accountService.open.mockReturnValue(of(SAVINGS_ACCOUNT));
    const fixture = await render();

    typeButton(fixture, 'Corriente').click();
    await fixture.whenStable();
    const overdraft = element(fixture).querySelector<HTMLInputElement>('input[formControlName="overdraftLimit"]')!;
    overdraft.value = '1000';
    overdraft.dispatchEvent(new Event('input'));
    typeButton(fixture, 'Ahorros').click();
    await submit(fixture);

    expect(accountService.open).toHaveBeenCalledWith(expect.objectContaining({ overdraftLimit: 0 }));
  });

  it('rejects a negative overdraft without calling the API', async () => {
    const fixture = await render();

    typeButton(fixture, 'Corriente').click();
    await fixture.whenStable();
    const overdraft = element(fixture).querySelector<HTMLInputElement>('input[formControlName="overdraftLimit"]')!;
    overdraft.value = '-1';
    overdraft.dispatchEvent(new Event('input'));
    await submit(fixture);

    expect(accountService.open).not.toHaveBeenCalled();
    expect(element(fixture).querySelector('mat-error')?.textContent?.trim()).toBe(
      'El cupo de sobregiro no puede ser negativo',
    );
  });

  it('stays open when the API rejects the account', async () => {
    accountService.open.mockReturnValue(throwError(() => new Error('404')));
    const fixture = await render();

    await submit(fixture);

    expect(dialogRef.close).not.toHaveBeenCalled();
    expect(element(fixture).querySelector<HTMLButtonElement>('button[type=submit]')!.disabled).toBe(false);
  });
});
