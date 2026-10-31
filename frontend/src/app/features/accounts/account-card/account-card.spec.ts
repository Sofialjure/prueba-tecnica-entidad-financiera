import { registerLocaleData } from '@angular/common';
import localeEsCo from '@angular/common/locales/es-CO';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Account } from '../../../core/models/account';
import { CHECKING_ACCOUNT, SAVINGS_ACCOUNT } from '../testing/accounts.fixtures';
import { AccountCard } from './account-card';

registerLocaleData(localeEsCo);

describe('AccountCard', () => {
  async function render(account: Account) {
    TestBed.configureTestingModule({
      imports: [AccountCard],
      providers: [{ provide: LOCALE_ID, useValue: 'es-CO' }],
    });
    const fixture = TestBed.createComponent(AccountCard);
    fixture.componentRef.setInput('account', account);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  const text = (element: HTMLElement) => element.textContent?.replace(/\s+/g, ' ') ?? '';

  it('shows a savings account with its number, status and balances', async () => {
    const card = await render(SAVINGS_ACCOUNT);

    expect(card.classList).toContain('savings');
    expect(text(card)).toContain('Cuenta de ahorros');
    expect(text(card)).toContain('Activa');
    expect(card.querySelector('.number')?.textContent).toBe('53 0000 0001');
    expect(text(card.querySelector('.balance')!)).toContain('$ 1.799.200,00');
    expect(text(card)).not.toContain('Cupo de sobregiro');
    expect(card.querySelector('.badge')).toBeNull();
  });

  it('shows the overdraft, a negative balance and the GMF exemption of a checking account', async () => {
    const card = await render(CHECKING_ACCOUNT);

    expect(card.classList).toContain('checking');
    expect(text(card)).toContain('Cuenta corriente');
    expect(card.querySelector('.balance strong')?.classList).toContain('negative');
    expect(text(card)).toContain('Cupo de sobregiro');
    expect(text(card)).toContain('$ 500.000');
    expect(card.querySelector('.badge')?.textContent).toBe('Exenta GMF');
  });

  it('greys out accounts that are not active', async () => {
    const card = await render({ ...SAVINGS_ACCOUNT, status: 'INACTIVE' });

    expect(card.classList).toContain('not-active');
    expect(text(card)).toContain('Inactiva');
  });
});
