import { registerLocaleData } from '@angular/common';
import localeEsCo from '@angular/common/locales/es-CO';
import { LOCALE_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { Customer } from '../../../core/models/customer';
import { NotificationService } from '../../../core/notification/notification.service';
import { AccountService } from '../../accounts/account.service';
import { SAVINGS_ACCOUNT } from '../../accounts/testing/accounts.fixtures';
import { CustomerService } from '../../customers/customer.service';
import { MovementForm } from '../movement-form/movement-form';
import { WITHDRAWAL_RECEIPT } from '../testing/transactions.fixtures';
import { TransactionService } from '../transaction.service';
import { TransactionsPage } from './transactions-page';

registerLocaleData(localeEsCo);

describe('TransactionsPage', () => {
  const accountService = { getAll: vi.fn() };
  const customerService = { getAll: vi.fn() };

  async function render(queryParams: { type?: string; account?: string } = {}) {
    accountService.getAll.mockReturnValue(of([SAVINGS_ACCOUNT]));
    customerService.getAll.mockReturnValue(
      of([{ id: 1, firstName: 'Ana María', lastName: 'Gómez' } as Customer]),
    );
    TestBed.configureTestingModule({
      imports: [TransactionsPage],
      providers: [
        { provide: AccountService, useValue: accountService },
        { provide: CustomerService, useValue: customerService },
        { provide: TransactionService, useValue: {} },
        { provide: NotificationService, useValue: { success: vi.fn(), error: vi.fn() } },
        { provide: LOCALE_ID, useValue: 'es-CO' },
      ],
    });
    const fixture = TestBed.createComponent(TransactionsPage);
    Object.entries(queryParams).forEach(([key, value]) =>
      fixture.componentRef.setInput(key, value),
    );
    await fixture.whenStable();
    return fixture;
  }

  const form = (fixture: ComponentFixture<TransactionsPage>) =>
    fixture.debugElement.query(By.directive(MovementForm));
  const element = (fixture: ComponentFixture<TransactionsPage>) =>
    fixture.nativeElement as HTMLElement;

  beforeEach(() => vi.resetAllMocks());

  it('starts on deposits and offers the active accounts with their owner', async () => {
    const fixture = await render();
    const movementForm = form(fixture).componentInstance as MovementForm;

    expect(element(fixture).querySelector('h2')?.textContent).toBe('Nueva consignación');
    expect(movementForm.kind()).toBe('deposit');
    expect(movementForm.options()).toEqual([
      { account: SAVINGS_ACCOUNT, ownerName: 'Ana María Gómez' },
    ]);
  });

  it('opens on the withdrawal of the account given in the address', async () => {
    const fixture = await render({ type: 'withdrawal', account: '5300000001' });
    const movementForm = form(fixture).componentInstance as MovementForm;

    expect(element(fixture).querySelector('h2')?.textContent).toBe('Nuevo retiro');
    expect(movementForm.initialAccount()).toBe('5300000001');
    expect(element(fixture).querySelector('.tips')?.textContent).toContain('GMF 4x1000');
  });

  it('switches between deposit and withdrawal', async () => {
    const fixture = await render();

    element(fixture).querySelectorAll<HTMLButtonElement>('mat-button-toggle button')[1].click();
    await fixture.whenStable();

    expect(element(fixture).querySelector('h2')?.textContent).toBe('Nuevo retiro');
  });

  it('shows the receipt and refreshes the balances after an operation', async () => {
    const fixture = await render();

    form(fixture).triggerEventHandler('completed', WITHDRAWAL_RECEIPT);
    await fixture.whenStable();

    expect(element(fixture).querySelector('app-transaction-receipt')).not.toBeNull();
    expect(element(fixture).querySelector('.tips')).toBeNull();
    expect(accountService.getAll).toHaveBeenCalledTimes(2);
  });
});
