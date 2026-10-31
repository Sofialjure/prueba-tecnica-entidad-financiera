import { registerLocaleData } from '@angular/common';
import localeEsCo from '@angular/common/locales/es-CO';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DEPOSIT_RECEIPT, WITHDRAWAL_RECEIPT } from '../testing/transactions.fixtures';
import { TransactionReceiptView } from './transaction-receipt';

registerLocaleData(localeEsCo);

describe('TransactionReceiptView', () => {
  async function render(receipt = WITHDRAWAL_RECEIPT) {
    TestBed.configureTestingModule({
      imports: [TransactionReceiptView],
      providers: [{ provide: LOCALE_ID, useValue: 'es-CO' }],
    });
    const fixture = TestBed.createComponent(TransactionReceiptView);
    fixture.componentRef.setInput('receipt', receipt);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  const rows = (element: HTMLElement) =>
    Array.from(element.querySelectorAll('.entries li'), (row) =>
      row.textContent?.replace(/\s+/g, ' '),
    );

  it('lists every movement of the operation with the balance after it', async () => {
    const element = await render();

    expect(rows(element)).toHaveLength(2);
    expect(rows(element)[0]).toContain('Retiro');
    expect(rows(element)[0]).toContain('53 0000 0001');
    expect(rows(element)[0]).toContain('− $ 100.000,00');
    expect(rows(element)[0]).toContain('Saldo $ 1.699.200,00');
    expect(rows(element)[1]).toContain('GMF 4x1000');
    expect(rows(element)[1]).toContain('− $ 400,00');
  });

  it('shows credits with a plus sign', async () => {
    expect(rows(await render(DEPOSIT_RECEIPT))[0]).toContain('+ $ 50.000,00');
  });

  it('shows the date and the reference that groups the movements', async () => {
    const element = await render();

    expect(element.querySelector('.header p')?.textContent).toBe('30 de octubre de 2026, 20:30');
    expect(element.querySelector('.reference code')?.textContent).toBe(
      WITHDRAWAL_RECEIPT.reference,
    );
  });
});
