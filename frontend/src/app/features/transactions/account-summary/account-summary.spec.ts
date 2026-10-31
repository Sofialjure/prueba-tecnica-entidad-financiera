import { registerLocaleData } from '@angular/common';
import localeEsCo from '@angular/common/locales/es-CO';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CHECKING_ACCOUNT, SAVINGS_ACCOUNT } from '../../accounts/testing/accounts.fixtures';
import { AccountSummary } from './account-summary';

registerLocaleData(localeEsCo);

describe('AccountSummary', () => {
  async function render(account = SAVINGS_ACCOUNT) {
    TestBed.configureTestingModule({
      imports: [AccountSummary],
      providers: [{ provide: LOCALE_ID, useValue: 'es-CO' }],
    });
    const fixture = TestBed.createComponent(AccountSummary);
    fixture.componentRef.setInput('option', { account, ownerName: 'Ana María Gómez' });
    await fixture.whenStable();
    return (fixture.nativeElement as HTMLElement).textContent?.replace(/\s+/g, ' ') ?? '';
  }

  it('shows the owner, the account type, the GMF condition and the available balance', async () => {
    const text = await render();

    expect(text).toContain('Ana María Gómez');
    expect(text).toContain('Cuenta de ahorros · Paga GMF 4x1000');
    expect(text).toContain('$ 1.799.200,00');
  });

  it('tells when the account is GMF exempt', async () => {
    expect(await render(CHECKING_ACCOUNT)).toContain('Cuenta corriente · Exenta GMF');
  });

  it('splits the available balance of a checking account into balance and overdraft', async () => {
    const text = await render(CHECKING_ACCOUNT);

    expect(text).toContain('Saldo -$ 250.000 + cupo $ 500.000');
    expect(text).toContain('Sobregiro en uso: $ 250.000');
  });

  it('does not talk about overdraft on savings accounts', async () => {
    expect(await render()).not.toContain('cupo');
  });
});
