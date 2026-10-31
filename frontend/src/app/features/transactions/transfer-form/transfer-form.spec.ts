import { registerLocaleData } from '@angular/common';
import localeEsCo from '@angular/common/locales/es-CO';
import { LOCALE_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { TransactionReceipt } from '../../../core/models/transaction';
import { NotificationService } from '../../../core/notification/notification.service';
import { CHECKING_ACCOUNT, SAVINGS_ACCOUNT } from '../../accounts/testing/accounts.fixtures';
import { AccountOption } from '../account-option';
import { WITHDRAWAL_RECEIPT } from '../testing/transactions.fixtures';
import { TransactionService } from '../transaction.service';
import { TransferForm } from './transfer-form';

registerLocaleData(localeEsCo);

const ANA_SAVINGS: AccountOption = { account: SAVINGS_ACCOUNT, ownerName: 'Ana María Gómez' };
const ANA_CHECKING: AccountOption = { account: CHECKING_ACCOUNT, ownerName: 'Ana María Gómez' };
const CARLOS: AccountOption = {
  account: {
    ...SAVINGS_ACCOUNT,
    id: 3,
    accountNumber: '5300000002',
    customerId: 2,
    gmfExempt: true,
  },
  ownerName: 'Carlos Andrés Pérez',
};

describe('TransferForm', () => {
  const transactionService = { transfer: vi.fn() };
  const notifications = { success: vi.fn(), error: vi.fn() };
  let completed: TransactionReceipt[];

  async function render(source?: string) {
    TestBed.configureTestingModule({
      imports: [TransferForm],
      providers: [
        { provide: TransactionService, useValue: transactionService },
        { provide: NotificationService, useValue: notifications },
        { provide: LOCALE_ID, useValue: 'es-CO' },
      ],
    });
    const fixture = TestBed.createComponent(TransferForm);
    fixture.componentRef.setInput('options', [ANA_SAVINGS, ANA_CHECKING, CARLOS]);
    if (source) {
      fixture.componentRef.setInput('initialAccount', source);
    }
    completed = [];
    fixture.componentInstance.completed.subscribe((receipt) => completed.push(receipt));
    await fixture.whenStable();
    return fixture;
  }

  const element = (fixture: ComponentFixture<TransferForm>) => fixture.nativeElement as HTMLElement;
  const norm = (text: string | null | undefined) => text?.replace(/\s+/g, ' ').trim();

  /** Sets a select through its form control, as choosing an option in the panel would. */
  async function choose(fixture: ComponentFixture<TransferForm>, name: string, value: string) {
    const form = (
      fixture.componentInstance as unknown as {
        form: { get(n: string): { setValue(v: string): void } };
      }
    ).form;
    form.get(name).setValue(value);
    await fixture.whenStable();
  }

  async function typeAmount(fixture: ComponentFixture<TransferForm>, value: string) {
    const input = element(fixture).querySelector<HTMLInputElement>(
      'input[formControlName="amount"]',
    )!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  }

  async function submit(fixture: ComponentFixture<TransferForm>) {
    element(fixture).querySelector<HTMLButtonElement>('button[type=submit]')!.click();
    await fixture.whenStable();
  }

  const breakdown = (fixture: ComponentFixture<TransferForm>) =>
    Array.from(element(fixture).querySelectorAll('.breakdown div'), (row) =>
      Array.from(row.querySelectorAll('span'), (cell) => norm(cell.textContent)),
    );

  const targetChoices = (fixture: ComponentFixture<TransferForm>) =>
    (fixture.componentInstance as unknown as { targetOptions(): AccountOption[] })
      .targetOptions()
      .map((option) => option.account.accountNumber);

  beforeEach(() => vi.resetAllMocks());

  it('transfers between two accounts and reports the receipt', async () => {
    transactionService.transfer.mockReturnValue(of(WITHDRAWAL_RECEIPT));
    const fixture = await render('5300000001');

    await choose(fixture, 'targetAccountNumber', '5300000002');
    await typeAmount(fixture, '100000');
    await submit(fixture);

    expect(transactionService.transfer).toHaveBeenCalledWith({
      sourceAccountNumber: '5300000001',
      targetAccountNumber: '5300000002',
      amount: 100000,
      description: undefined,
    });
    expect(norm(notifications.success.mock.calls[0][0])).toBe(
      'Transferencia de $ 100.000 de la cuenta 53 0000 0001 a la 53 0000 0002 realizada',
    );
    expect(completed).toEqual([WITHDRAWAL_RECEIPT]);
  });

  it('shows the 4x1000 charged to the source and what the target receives', async () => {
    const fixture = await render('5300000001');

    await choose(fixture, 'targetAccountNumber', '5300000002');
    await typeAmount(fixture, '100000');

    expect(breakdown(fixture)).toEqual([
      ['Transferencia', '$ 100.000,00'],
      ['GMF 4x1000 (cuenta de origen)', '$ 400,00'],
      ['Total a debitar del origen', '$ 100.400,00'],
      ['Carlos Andrés Pérez recibe', '$ 100.000,00'],
    ]);
  });

  it('never offers the source account as target', async () => {
    const fixture = await render('5300000001');

    expect(targetChoices(fixture)).toEqual(['3300000001', '5300000002']);
  });

  it('clears the target when it is chosen as source', async () => {
    const fixture = await render('5300000001');
    await choose(fixture, 'targetAccountNumber', '5300000002');

    await choose(fixture, 'sourceAccountNumber', '5300000002');

    expect(targetChoices(fixture)).toEqual(['5300000001', '3300000001']);
    expect(element(fixture).querySelector('.receives')).toBeNull();
  });

  it('blocks a transfer the source cannot cover with its 4x1000', async () => {
    const fixture = await render('5300000001');
    await choose(fixture, 'targetAccountNumber', '5300000002');

    await typeAmount(fixture, '1799000');
    await submit(fixture);

    expect(transactionService.transfer).not.toHaveBeenCalled();
    expect(norm(element(fixture).querySelector('mat-error')?.textContent)).toBe(
      'Saldo disponible insuficiente en la cuenta de origen: $ 1.799.200,00',
    );
  });

  it('asks for both accounts and a positive amount', async () => {
    const fixture = await render();

    await submit(fixture);

    expect(transactionService.transfer).not.toHaveBeenCalled();
    expect(
      Array.from(element(fixture).querySelectorAll('mat-error'), (e) => norm(e.textContent)),
    ).toEqual([
      'Seleccione la cuenta que envía',
      'Seleccione la cuenta que recibe',
      'Este campo es obligatorio',
    ]);
  });

  it('keeps the data when the API rejects the transfer', async () => {
    transactionService.transfer.mockReturnValue(throwError(() => new Error('422')));
    const fixture = await render('5300000001');
    await choose(fixture, 'targetAccountNumber', '5300000002');

    await typeAmount(fixture, '1000');
    await submit(fixture);

    expect(completed).toEqual([]);
    expect(
      element(fixture).querySelector<HTMLInputElement>('input[formControlName="amount"]')!.value,
    ).toBe('1.000');
  });
});
