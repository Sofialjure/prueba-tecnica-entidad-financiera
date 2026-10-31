import { registerLocaleData } from '@angular/common';
import localeEsCo from '@angular/common/locales/es-CO';
import { LOCALE_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { Customer } from '../../../core/models/customer';
import { NotificationService } from '../../../core/notification/notification.service';
import { ConfirmService } from '../../../shared/components/confirm-dialog/confirm.service';
import { CustomerService } from '../customer.service';
import { CustomerList } from './customer-list';

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
  updatedAt: '2026-10-01T08:00:00',
};
const CARLOS: Customer = {
  ...ANA,
  id: 2,
  identificationNumber: '79845123',
  firstName: 'Carlos Andrés',
  lastName: 'Pérez',
  email: 'carlos.perez@correo.com',
};

describe('CustomerList', () => {
  const customerService = { getAll: vi.fn(), delete: vi.fn() };
  const confirmService = { confirm: vi.fn() };
  const notifications = { success: vi.fn(), error: vi.fn() };

  async function render(customers$ = of([ANA, CARLOS])) {
    customerService.getAll.mockReturnValue(customers$);
    TestBed.configureTestingModule({
      imports: [CustomerList],
      providers: [
        { provide: CustomerService, useValue: customerService },
        { provide: ConfirmService, useValue: confirmService },
        { provide: NotificationService, useValue: notifications },
        { provide: LOCALE_ID, useValue: 'es-CO' },
      ],
    });
    const fixture = TestBed.createComponent(CustomerList);
    await fixture.whenStable();
    return fixture;
  }

  const rows = (fixture: ComponentFixture<CustomerList>) =>
    Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('tr[mat-row]'));

  beforeEach(() => vi.resetAllMocks());

  it('shows every customer with its formatted data', async () => {
    const fixture = await render();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('.subtitle')?.textContent).toBe('2 clientes registrados');
    expect(rows(fixture)).toHaveLength(2);
    const firstRow = rows(fixture)[0].textContent ?? '';
    expect(firstRow).toContain('CC 1020304050');
    expect(firstRow).toContain('Ana María Gómez');
    expect(firstRow).toContain('ana.gomez@correo.com');
    expect(firstRow).toContain('12/04/1995');
    expect(firstRow).toContain('01/10/2026 08:00');
  });

  it('shows a progress bar while loading', async () => {
    const fixture = await render(new Subject<Customer[]>());

    expect((fixture.nativeElement as HTMLElement).querySelector('mat-progress-bar')).not.toBeNull();
  });

  it('shows an empty state when there are no customers', async () => {
    const fixture = await render(of([]));

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('No hay clientes registrados');
  });

  it('filters by name ignoring case and accents', async () => {
    const fixture = await render();
    const input = (fixture.nativeElement as HTMLElement).querySelector('input')!;

    input.value = 'perez';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    expect(rows(fixture)).toHaveLength(1);
    expect(rows(fixture)[0].textContent).toContain('Carlos Andrés Pérez');
  });

  it('tells when no customer matches the search', async () => {
    const fixture = await render();
    const input = (fixture.nativeElement as HTMLElement).querySelector('input')!;

    input.value = 'zzz';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Ningún cliente coincide con la búsqueda',
    );
  });

  it('deletes a customer after confirmation and removes it from the table', async () => {
    const fixture = await render();
    confirmService.confirm.mockReturnValue(of(true));
    customerService.delete.mockReturnValue(of(undefined));

    (rows(fixture)[0].querySelector('button') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(confirmService.confirm).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Eliminar cliente', destructive: true }),
    );
    expect(customerService.delete).toHaveBeenCalledWith(1);
    expect(notifications.success).toHaveBeenCalledWith('Cliente Ana María Gómez eliminado');
    expect(rows(fixture)).toHaveLength(1);
  });

  it('does nothing when the user does not confirm', async () => {
    const fixture = await render();
    confirmService.confirm.mockReturnValue(of(false));

    (rows(fixture)[0].querySelector('button') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(customerService.delete).not.toHaveBeenCalled();
    expect(rows(fixture)).toHaveLength(2);
  });

  it('keeps the customer when the API rejects the deletion', async () => {
    const fixture = await render();
    confirmService.confirm.mockReturnValue(of(true));
    customerService.delete.mockReturnValue(throwError(() => new Error('409')));

    (rows(fixture)[0].querySelector('button') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(notifications.success).not.toHaveBeenCalled();
    expect(rows(fixture)).toHaveLength(2);
  });
});
