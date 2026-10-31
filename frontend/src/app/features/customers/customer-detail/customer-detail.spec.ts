import { registerLocaleData } from '@angular/common';
import localeEsCo from '@angular/common/locales/es-CO';
import { LOCALE_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Customer } from '../../../core/models/customer';
import { NotificationService } from '../../../core/notification/notification.service';
import { ConfirmService } from '../../../shared/components/confirm-dialog/confirm.service';
import { AccountService } from '../../accounts/account.service';
import { OpenAccountDialog } from '../../accounts/open-account-dialog/open-account-dialog';
import { CHECKING_ACCOUNT, SAVINGS_ACCOUNT } from '../../accounts/testing/accounts.fixtures';
import { CustomerService } from '../customer.service';
import { CustomerDetail } from './customer-detail';

registerLocaleData(localeEsCo);

const ANA: Customer = {
  id: 1,
  identificationType: 'CC',
  identificationNumber: '1020304050',
  firstName: 'Ana María',
  lastName: 'Gómez',
  email: 'ana.gomez@correo.com',
  birthDate: '1995-04-12',
  createdAt: '2026-10-01T08:00:00',
  updatedAt: '2026-10-02T09:30:00',
};

describe('CustomerDetail', () => {
  const customerService = { getById: vi.fn() };
  const accountService = { getByCustomer: vi.fn(), changeStatus: vi.fn() };
  const confirmService = { confirm: vi.fn() };
  const dialog = { open: vi.fn() };
  const notifications = { success: vi.fn(), error: vi.fn() };
  let router: Router;

  async function render(accounts = [SAVINGS_ACCOUNT]) {
    customerService.getById.mockReturnValue(of(ANA));
    accountService.getByCustomer.mockReturnValue(of(accounts));
    TestBed.configureTestingModule({
      imports: [CustomerDetail],
      providers: [
        provideRouter([]),
        { provide: CustomerService, useValue: customerService },
        { provide: AccountService, useValue: accountService },
        { provide: MatDialog, useValue: dialog },
        { provide: ConfirmService, useValue: confirmService },
        { provide: NotificationService, useValue: notifications },
        { provide: LOCALE_ID, useValue: 'es-CO' },
      ],
    });
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(CustomerDetail);
    fixture.componentRef.setInput('id', '1');
    await fixture.whenStable();
    return fixture;
  }

  const element = (fixture: ComponentFixture<CustomerDetail>) =>
    fixture.nativeElement as HTMLElement;

  beforeEach(() => vi.resetAllMocks());

  it('shows the customer profile', async () => {
    const page = element(await render());

    expect(customerService.getById).toHaveBeenCalledWith(1);
    expect(page.querySelector('h1')?.textContent).toBe('Ana María Gómez');
    expect(page.querySelector('.identity')?.textContent).toContain('Cédula de ciudadanía');
    expect(page.querySelector('.facts')?.textContent).toContain('ana.gomez@correo.com');
    expect(page.querySelector('.facts')?.textContent).toContain('12/04/1995');
    expect(page.querySelector('a.edit')?.getAttribute('href')).toBe('/customers/1/edit');
  });

  it('shows one card per account', async () => {
    const page = element(await render([SAVINGS_ACCOUNT, CHECKING_ACCOUNT]));

    expect(accountService.getByCustomer).toHaveBeenCalledWith(1);
    expect(page.querySelectorAll('app-account-card')).toHaveLength(2);
    expect(page.querySelector('.accounts-header p')?.textContent).toBe('2 cuentas');
  });

  it('invites to open the first account when there are none', async () => {
    const page = element(await render([]));

    expect(page.textContent).toContain('Este cliente todavía no tiene cuentas');
  });

  it('adds the account opened in the dialog and confirms it in green', async () => {
    const fixture = await render([SAVINGS_ACCOUNT]);
    dialog.open.mockReturnValue({ afterClosed: () => of(CHECKING_ACCOUNT) });

    element(fixture).querySelector<HTMLButtonElement>('.accounts-header button')!.click();
    await fixture.whenStable();

    expect(dialog.open).toHaveBeenCalledWith(OpenAccountDialog, {
      data: { customerId: 1, customerName: 'Ana María Gómez' },
      width: '520px',
    });
    expect(element(fixture).querySelectorAll('app-account-card')).toHaveLength(2);
    expect(notifications.success).toHaveBeenCalledWith('Cuenta corriente 33 0000 0001 abierta');
  });

  it('changes nothing when the dialog is cancelled', async () => {
    const fixture = await render([SAVINGS_ACCOUNT]);
    dialog.open.mockReturnValue({ afterClosed: () => of(undefined) });

    element(fixture).querySelector<HTMLButtonElement>('.accounts-header button')!.click();
    await fixture.whenStable();

    expect(element(fixture).querySelectorAll('app-account-card')).toHaveLength(1);
    expect(notifications.success).not.toHaveBeenCalled();
  });

  it('inactivates an account after confirmation and updates its card', async () => {
    const fixture = await render([SAVINGS_ACCOUNT, CHECKING_ACCOUNT]);
    confirmService.confirm.mockReturnValue(of(true));
    accountService.changeStatus.mockReturnValue(of({ ...SAVINGS_ACCOUNT, status: 'INACTIVE' }));

    fixture.debugElement
      .query((node) => node.name === 'app-account-card')
      .triggerEventHandler('statusChange', 'deactivate');
    await fixture.whenStable();

    expect(confirmService.confirm).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Inactivar cuenta', confirmText: 'Inactivar' }),
    );
    expect(accountService.changeStatus).toHaveBeenCalledWith(1, 'deactivate');
    expect(notifications.success).toHaveBeenCalledWith('Cuenta 53 0000 0001 inactivada');
    expect(element(fixture).querySelector('app-account-card')?.classList).toContain('not-active');
  });

  it('asks with a red button before cancelling an account for good', async () => {
    const fixture = await render([{ ...SAVINGS_ACCOUNT, balance: 0 }]);
    confirmService.confirm.mockReturnValue(of(true));
    accountService.changeStatus.mockReturnValue(
      of({ ...SAVINGS_ACCOUNT, balance: 0, status: 'CANCELLED' }),
    );

    fixture.debugElement
      .query((node) => node.name === 'app-account-card')
      .triggerEventHandler('statusChange', 'cancel');
    await fixture.whenStable();

    expect(confirmService.confirm).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Cancelar cuenta', destructive: true }),
    );
    expect(notifications.success).toHaveBeenCalledWith('Cuenta 53 0000 0001 cancelada');
  });

  it('changes nothing when the status change is not confirmed or the API refuses it', async () => {
    const fixture = await render([SAVINGS_ACCOUNT]);
    const card = () => fixture.debugElement.query((node) => node.name === 'app-account-card');

    confirmService.confirm.mockReturnValue(of(false));
    card().triggerEventHandler('statusChange', 'activate');
    await fixture.whenStable();
    expect(accountService.changeStatus).not.toHaveBeenCalled();

    confirmService.confirm.mockReturnValue(of(true));
    accountService.changeStatus.mockReturnValue(throwError(() => new Error('422')));
    card().triggerEventHandler('statusChange', 'activate');
    await fixture.whenStable();
    expect(notifications.success).not.toHaveBeenCalled();
    expect(element(fixture).querySelector('app-account-card')?.classList).not.toContain(
      'not-active',
    );
  });

  it('goes back to the list when the customer does not exist', async () => {
    customerService.getById.mockReturnValue(throwError(() => new Error('404')));
    accountService.getByCustomer.mockReturnValue(of([]));
    TestBed.configureTestingModule({
      imports: [CustomerDetail],
      providers: [
        provideRouter([]),
        { provide: CustomerService, useValue: customerService },
        { provide: AccountService, useValue: accountService },
        { provide: MatDialog, useValue: dialog },
        { provide: NotificationService, useValue: notifications },
      ],
    });
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(CustomerDetail);
    fixture.componentRef.setInput('id', '99');
    await fixture.whenStable();

    expect(router.navigate).toHaveBeenCalledWith(['/customers']);
  });
});
