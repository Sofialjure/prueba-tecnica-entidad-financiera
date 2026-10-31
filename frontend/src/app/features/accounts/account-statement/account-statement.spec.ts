import { registerLocaleData } from '@angular/common';
import localeEsCo from '@angular/common/locales/es-CO';
import { LOCALE_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Customer } from '../../../core/models/customer';
import { AccountStatement as Statement } from '../../../core/models/transaction';
import { CustomerService } from '../../customers/customer.service';
import {
  DEPOSIT_RECEIPT,
  WITHDRAWAL_RECEIPT,
} from '../../transactions/testing/transactions.fixtures';
import { TransactionService } from '../../transactions/transaction.service';
import { SAVINGS_ACCOUNT } from '../testing/accounts.fixtures';
import { AccountStatement } from './account-statement';

registerLocaleData(localeEsCo);

const STATEMENT: Statement = {
  account: SAVINGS_ACCOUNT,
  transactions: [...WITHDRAWAL_RECEIPT.entries, ...DEPOSIT_RECEIPT.entries],
};

describe('AccountStatement', () => {
  const transactionService = { getStatement: vi.fn() };
  const customerService = { getById: vi.fn() };
  let router: Router;

  async function render(statement$ = of(STATEMENT)) {
    transactionService.getStatement.mockReturnValue(statement$);
    customerService.getById.mockReturnValue(
      of({ id: 1, firstName: 'Ana María', lastName: 'Gómez' } as Customer),
    );
    TestBed.configureTestingModule({
      imports: [AccountStatement],
      providers: [
        provideRouter([]),
        { provide: TransactionService, useValue: transactionService },
        { provide: CustomerService, useValue: customerService },
        { provide: LOCALE_ID, useValue: 'es-CO' },
      ],
    });
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(AccountStatement);
    fixture.componentRef.setInput('id', '1');
    await fixture.whenStable();
    return fixture;
  }

  const element = (fixture: ComponentFixture<AccountStatement>) =>
    fixture.nativeElement as HTMLElement;
  const norm = (text: string | null | undefined) => text?.replace(/\s+/g, ' ').trim();
  const rows = (fixture: ComponentFixture<AccountStatement>) =>
    Array.from(element(fixture).querySelectorAll('tr[mat-row]'), (row) => norm(row.textContent));

  beforeEach(() => vi.resetAllMocks());

  it('shows the account, its owner and a way back to the owner', async () => {
    const fixture = await render();

    expect(transactionService.getStatement).toHaveBeenCalledWith(1);
    expect(customerService.getById).toHaveBeenCalledWith(1);
    expect(norm(element(fixture).querySelector('.subtitle')?.textContent)).toBe(
      'Ana María Gómez · 53 0000 0001',
    );
    expect(element(fixture).querySelector('a.back')?.getAttribute('href')).toBe('/customers/1');
    expect(element(fixture).querySelector('app-account-card .menu-button')).toBeNull();
  });

  it('adds up credits, debits and the 4x1000 paid', async () => {
    const totals = Array.from(element(await render()).querySelectorAll('.total strong'), (value) =>
      norm(value.textContent),
    );

    expect(totals).toEqual(['$ 50.000,00', '$ 100.400,00', '$ 400,00', '3']);
  });

  it('lists every movement with its sign and the balance after it', async () => {
    const fixture = await render();

    expect(rows(fixture)).toHaveLength(3);
    expect(rows(fixture)[0]).toContain('30/10/2026');
    expect(rows(fixture)[0]).toContain('20:30');
    expect(rows(fixture)[0]).toContain('Retiro');
    expect(rows(fixture)[0]).toContain('fadd403e');
    expect(rows(fixture)[0]).toContain('−$ 100.000,00');
    expect(rows(fixture)[0]).toContain('$ 1.699.200,00');
    expect(rows(fixture)[2]).toContain('+$ 50.000,00');
  });

  it('filters by movement type', async () => {
    const fixture = await render();
    const gmfChip = Array.from(
      element(fixture).querySelectorAll<HTMLElement>('mat-chip-option'),
    ).find((chip) => chip.textContent?.includes('GMF'))!;

    gmfChip.querySelector<HTMLButtonElement>('button')!.click();
    await fixture.whenStable();

    expect(rows(fixture)).toHaveLength(1);
    expect(rows(fixture)[0]).toContain('GMF 4x1000');
  });

  it('downloads the movements as CSV', async () => {
    const fixture = await render();
    const createObjectURL = vi.fn().mockReturnValue('blob:statement');
    const revokeObjectURL = vi.fn();
    Object.assign(URL, { createObjectURL, revokeObjectURL });
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);

    element(fixture).querySelector<HTMLButtonElement>('app-page-header button')!.click();

    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(click).toHaveBeenCalled();
    expect((click.mock.instances[0] as unknown as HTMLAnchorElement).download).toBe(
      'estado-cuenta-5300000001.csv',
    );
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:statement');
    click.mockRestore();
  });

  it('tells when the account has no movements', async () => {
    const fixture = await render(of({ account: SAVINGS_ACCOUNT, transactions: [] }));

    expect(element(fixture).textContent).toContain('Esta cuenta todavía no tiene movimientos');
    expect(
      element(fixture).querySelector<HTMLButtonElement>('app-page-header button')!.disabled,
    ).toBe(true);
  });

  it('goes back to the customers when the account does not exist', async () => {
    await render(throwError(() => new Error('404')));

    expect(router.navigate).toHaveBeenCalledWith(['/customers']);
  });
});
