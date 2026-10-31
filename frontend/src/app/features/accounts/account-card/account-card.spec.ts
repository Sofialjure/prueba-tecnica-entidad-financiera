import { registerLocaleData } from '@angular/common';
import localeEsCo from '@angular/common/locales/es-CO';
import { ApplicationRef, LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Account, AccountAction } from '../../../core/models/account';
import { CHECKING_ACCOUNT, SAVINGS_ACCOUNT } from '../testing/accounts.fixtures';
import { AccountCard } from './account-card';

registerLocaleData(localeEsCo);

describe('AccountCard', () => {
  let emitted: AccountAction[];

  async function render(account: Account) {
    TestBed.configureTestingModule({
      imports: [AccountCard],
      providers: [{ provide: LOCALE_ID, useValue: 'es-CO' }, provideRouter([])],
    });
    const fixture = TestBed.createComponent(AccountCard);
    fixture.componentRef.setInput('account', account);
    emitted = [];
    fixture.componentInstance.statusChange.subscribe((action) => emitted.push(action));
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  /** Opens the card menu; its items render in an overlay outside the card. */
  async function openMenu(card: HTMLElement) {
    card.querySelector<HTMLButtonElement>('.menu-button')!.click();
    await TestBed.inject(ApplicationRef).whenStable();
  }

  /** Status actions are buttons; the deposit and withdrawal shortcuts are links. */
  async function menuItems(card: HTMLElement) {
    await openMenu(card);
    return Array.from(document.querySelectorAll<HTMLButtonElement>('button.mat-mdc-menu-item'));
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

  it('offers to inactivate an active account and to cancel it when its balance is $0', async () => {
    const items = await menuItems(await render({ ...SAVINGS_ACCOUNT, balance: 0 }));

    expect(items).toHaveLength(2);
    expect(items[0].textContent).toContain('Inactivar cuenta');
    expect(items[1].textContent).toContain('Cancelar cuenta');
    expect(items[1].disabled).toBe(false);

    items[0].click();
    expect(emitted).toEqual(['deactivate']);
  });

  it('links an active account to its statement and to the deposit, withdrawal and transfer screens', async () => {
    await openMenu(await render(SAVINGS_ACCOUNT));
    const links = Array.from(document.querySelectorAll('a.mat-mdc-menu-item'), (link) =>
      link.getAttribute('href'),
    );

    expect(links).toEqual([
      '/accounts/1/statement',
      '/transactions?type=deposit&account=5300000001',
      '/transactions?type=withdrawal&account=5300000001',
      '/transactions?type=transfer&account=5300000001',
    ]);
  });

  it('offers to activate an inactive account without money shortcuts', async () => {
    await openMenu(await render({ ...SAVINGS_ACCOUNT, status: 'INACTIVE' }));

    expect(document.querySelectorAll('a.mat-mdc-menu-item')).toHaveLength(1);
    expect(document.querySelector('a.mat-mdc-menu-item')?.textContent).toContain(
      'Estado de cuenta',
    );
  });

  it('offers to activate an inactive account', async () => {
    const items = await menuItems(
      await render({ ...SAVINGS_ACCOUNT, status: 'INACTIVE', balance: 0 }),
    );

    items[0].click();
    items[1].click();
    expect(items[0].textContent).toContain('Activar cuenta');
    expect(emitted).toEqual(['activate', 'cancel']);
  });

  it('does not allow cancelling while the balance is not $0', async () => {
    const items = await menuItems(await render(SAVINGS_ACCOUNT));

    expect(items[1].disabled).toBe(true);
    expect(items[1].textContent).toContain('Requiere saldo $0');
  });

  it('only offers the statement of a cancelled account', async () => {
    await openMenu(await render({ ...SAVINGS_ACCOUNT, status: 'CANCELLED', balance: 0 }));

    expect(document.querySelectorAll('button.mat-mdc-menu-item')).toHaveLength(0);
    expect(
      Array.from(document.querySelectorAll('a.mat-mdc-menu-item'), (link) =>
        link.getAttribute('href'),
      ),
    ).toEqual(['/accounts/1/statement']);
  });

  it('can be shown without menu', async () => {
    TestBed.configureTestingModule({
      imports: [AccountCard],
      providers: [{ provide: LOCALE_ID, useValue: 'es-CO' }, provideRouter([])],
    });
    const fixture = TestBed.createComponent(AccountCard);
    fixture.componentRef.setInput('account', SAVINGS_ACCOUNT);
    fixture.componentRef.setInput('actions', false);
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).querySelector('.menu-button')).toBeNull();
  });

  it('greys out accounts that are not active', async () => {
    const card = await render({ ...SAVINGS_ACCOUNT, status: 'INACTIVE' });

    expect(card.classList).toContain('not-active');
    expect(text(card)).toContain('Inactiva');
  });
});
