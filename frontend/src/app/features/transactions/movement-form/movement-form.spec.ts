import { registerLocaleData } from '@angular/common';
import localeEsCo from '@angular/common/locales/es-CO';
import { LOCALE_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { TransactionReceipt } from '../../../core/models/transaction';
import { NotificationService } from '../../../core/notification/notification.service';
import { CHECKING_ACCOUNT, SAVINGS_ACCOUNT } from '../../accounts/testing/accounts.fixtures';
import { AccountOption } from '../account-option';
import { DEPOSIT_RECEIPT, WITHDRAWAL_RECEIPT } from '../testing/transactions.fixtures';
import { TransactionService } from '../transaction.service';
import { MovementForm, MovementKind } from './movement-form';

registerLocaleData(localeEsCo);

const OPTIONS: AccountOption[] = [
  { account: SAVINGS_ACCOUNT, ownerName: 'Ana María Gómez' },
  { account: CHECKING_ACCOUNT, ownerName: 'Ana María Gómez' },
];

describe('MovementForm', () => {
  const transactionService = { deposit: vi.fn(), withdraw: vi.fn() };
  const notifications = { success: vi.fn(), error: vi.fn() };
  let completed: TransactionReceipt[];

  async function render(kind: MovementKind, account?: string) {
    TestBed.configureTestingModule({
      imports: [MovementForm],
      providers: [
        { provide: TransactionService, useValue: transactionService },
        { provide: NotificationService, useValue: notifications },
        { provide: LOCALE_ID, useValue: 'es-CO' },
      ],
    });
    const fixture = TestBed.createComponent(MovementForm);
    fixture.componentRef.setInput('kind', kind);
    fixture.componentRef.setInput('options', OPTIONS);
    if (account) {
      fixture.componentRef.setInput('initialAccount', account);
    }
    completed = [];
    fixture.componentInstance.completed.subscribe((receipt) => completed.push(receipt));
    await fixture.whenStable();
    return fixture;
  }

  const element = (fixture: ComponentFixture<MovementForm>) => fixture.nativeElement as HTMLElement;

  async function type(fixture: ComponentFixture<MovementForm>, name: string, value: string) {
    const input = element(fixture).querySelector<HTMLInputElement>(
      `input[formControlName="${name}"]`,
    )!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  }

  async function submit(fixture: ComponentFixture<MovementForm>) {
    element(fixture).querySelector<HTMLButtonElement>('button[type=submit]')!.click();
    await fixture.whenStable();
  }

  /** Currency texts use a non-breaking space after the $ sign. */
  const norm = (text: string | null | undefined) => text?.replace(/\s+/g, ' ').trim();

  const errors = (fixture: ComponentFixture<MovementForm>) =>
    Array.from(element(fixture).querySelectorAll('mat-error'), (error) => norm(error.textContent));

  beforeEach(() => vi.resetAllMocks());

  it('deposits into the preselected account and reports the receipt', async () => {
    transactionService.deposit.mockReturnValue(of(DEPOSIT_RECEIPT));
    const fixture = await render('deposit', '5300000001');

    expect(norm(element(fixture).querySelector('.account-summary')?.textContent)).toContain(
      '$ 1.799.200,00',
    );
    await type(fixture, 'amount', '50000');
    await type(fixture, 'description', '  Nómina ');
    await submit(fixture);

    expect(transactionService.deposit).toHaveBeenCalledWith({
      accountNumber: '5300000001',
      amount: 50000,
      description: 'Nómina',
    });
    expect(norm(notifications.success.mock.calls[0][0])).toBe(
      'Consignación de $ 50.000 realizada en la cuenta 53 0000 0001',
    );
    expect(completed).toEqual([DEPOSIT_RECEIPT]);
    expect(
      element(fixture).querySelector<HTMLInputElement>('input[formControlName="amount"]')!.value,
    ).toBe('');
  });

  it('previews the 4x1000 and the total of a withdrawal', async () => {
    const fixture = await render('withdrawal', '5300000001');

    await type(fixture, 'amount', '100000');

    const rows = Array.from(element(fixture).querySelectorAll('.breakdown div'), (row) =>
      Array.from(row.querySelectorAll('span'), (cell) => norm(cell.textContent)),
    );
    expect(rows).toEqual([
      ['Retiro', '$ 100.000,00'],
      ['GMF 4x1000', '$ 400,00'],
      ['Total a debitar', '$ 100.400,00'],
      ['Saldo después del retiro', '$ 1.698.800,00'],
    ]);
  });

  it('withdraws and leaves out the description when it is blank', async () => {
    transactionService.withdraw.mockReturnValue(of(WITHDRAWAL_RECEIPT));
    const fixture = await render('withdrawal', '5300000001');

    await type(fixture, 'amount', '100000');
    await submit(fixture);

    expect(transactionService.withdraw).toHaveBeenCalledWith({
      accountNumber: '5300000001',
      amount: 100000,
      description: undefined,
    });
    expect(completed).toEqual([WITHDRAWAL_RECEIPT]);
  });

  it('blocks a withdrawal that the available balance plus GMF cannot cover', async () => {
    const fixture = await render('withdrawal', '5300000001');

    // 1.799.000 + GMF 7.196 > 1.799.200 available
    await type(fixture, 'amount', '1799000');
    await submit(fixture);

    expect(transactionService.withdraw).not.toHaveBeenCalled();
    expect(errors(fixture)).toEqual(['Saldo disponible insuficiente: $ 1.799.200,00']);
  });

  it('tells how much of the overdraft a checking withdrawal will use', async () => {
    const fixture = await render('withdrawal', '3300000001');

    // Balance -250.000 and limit 500.000: withdrawing 100.000 (GMF exempt) uses 100.000 more
    await type(fixture, 'amount', '100000');

    const rows = Array.from(element(fixture).querySelectorAll('.breakdown div'), (row) =>
      Array.from(row.querySelectorAll('span'), (cell) => norm(cell.textContent)),
    );
    expect(rows).toContainEqual(['Usará del cupo de sobregiro', '$ 100.000,00']);
    expect(rows).toContainEqual(['Saldo después del retiro', '-$ 350.000,00']);
    expect(element(fixture).querySelector('.after')?.classList).toContain('negative');
  });

  it('lets a checking account use its overdraft', async () => {
    transactionService.withdraw.mockReturnValue(of(WITHDRAWAL_RECEIPT));
    const fixture = await render('withdrawal', '3300000001');

    // Available $250.000 thanks to the overdraft; the account is GMF exempt
    await type(fixture, 'amount', '250000');
    await submit(fixture);

    expect(transactionService.withdraw).toHaveBeenCalled();
  });

  it('does not check the balance on deposits', async () => {
    transactionService.deposit.mockReturnValue(of(DEPOSIT_RECEIPT));
    const fixture = await render('deposit', '5300000001');

    await type(fixture, 'amount', '99999999');
    await submit(fixture);

    expect(transactionService.deposit).toHaveBeenCalled();
    expect(element(fixture).querySelector('.breakdown')).toBeNull();
  });

  it('asks for an account and a positive amount', async () => {
    const fixture = await render('deposit');

    await type(fixture, 'amount', '0');
    await submit(fixture);

    expect(transactionService.deposit).not.toHaveBeenCalled();
    expect(errors(fixture)).toEqual(['Seleccione una cuenta', 'El monto debe ser mayor a $0']);
  });

  it('writes the amount with thousand dots', async () => {
    const fixture = await render('deposit', '5300000001');

    await type(fixture, 'amount', '6600');

    expect(
      element(fixture).querySelector<HTMLInputElement>('input[formControlName="amount"]')!.value,
    ).toBe('6.600');
  });

  it('ignores a preselected account that is not active', async () => {
    const fixture = await render('deposit', '3300000002');

    expect(element(fixture).querySelector('.account-summary')).toBeNull();
  });

  it('keeps the data when the API rejects the operation', async () => {
    transactionService.deposit.mockReturnValue(throwError(() => new Error('422')));
    const fixture = await render('deposit', '5300000001');

    await type(fixture, 'amount', '50000');
    await submit(fixture);

    expect(completed).toEqual([]);
    expect(
      element(fixture).querySelector<HTMLInputElement>('input[formControlName="amount"]')!.value,
    ).toBe('50.000');
  });
});
