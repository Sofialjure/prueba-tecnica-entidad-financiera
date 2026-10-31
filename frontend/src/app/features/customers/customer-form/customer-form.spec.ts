import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Customer } from '../../../core/models/customer';
import { NotificationService } from '../../../core/notification/notification.service';
import { CustomerService } from '../customer.service';
import { CustomerForm } from './customer-form';

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
const { id, createdAt, updatedAt, ...ANA_DATA } = ANA;

describe('CustomerForm', () => {
  const customerService = { getById: vi.fn(), create: vi.fn(), update: vi.fn() };
  const notifications = { success: vi.fn(), error: vi.fn() };
  let router: Router;

  async function render(customerId?: string) {
    TestBed.configureTestingModule({
      imports: [CustomerForm],
      providers: [
        provideRouter([]),
        { provide: CustomerService, useValue: customerService },
        { provide: NotificationService, useValue: notifications },
      ],
    });
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(CustomerForm);
    if (customerId) {
      fixture.componentRef.setInput('id', customerId);
    }
    await fixture.whenStable();
    return fixture;
  }

  function type(fixture: ComponentFixture<CustomerForm>, name: string, value: string) {
    const input = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(
      `input[formControlName="${name}"]`,
    )!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  function fill(fixture: ComponentFixture<CustomerForm>) {
    type(fixture, 'identificationNumber', ANA.identificationNumber);
    type(fixture, 'firstName', ANA.firstName);
    type(fixture, 'lastName', ANA.lastName);
    type(fixture, 'email', ANA.email);
    type(fixture, 'birthDate', ANA.birthDate);
  }

  async function submit(fixture: ComponentFixture<CustomerForm>) {
    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('button[type=submit]')!.click();
    await fixture.whenStable();
  }

  const errors = (fixture: ComponentFixture<CustomerForm>) =>
    Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('mat-error'), (error) =>
      error.textContent?.trim(),
    );

  beforeEach(() => vi.resetAllMocks());

  it('creates a customer and goes back to the list', async () => {
    customerService.create.mockReturnValue(of(ANA));
    const fixture = await render();

    fill(fixture);
    await submit(fixture);

    expect(customerService.create).toHaveBeenCalledWith(ANA_DATA);
    expect(notifications.success).toHaveBeenCalledWith('Cliente Ana María Gómez creado');
    expect(router.navigate).toHaveBeenCalledWith(['/customers']);
    expect((fixture.nativeElement as HTMLElement).querySelector('h1')?.textContent).toBe('Nuevo cliente');
  });

  it('shows the errors in Spanish and does not call the API when the data is invalid', async () => {
    const fixture = await render();

    type(fixture, 'identificationNumber', '12');
    type(fixture, 'firstName', ' A ');
    type(fixture, 'email', 'ana@correo');
    type(fixture, 'birthDate', '2015-01-01');
    await submit(fixture);

    expect(customerService.create).not.toHaveBeenCalled();
    expect(errors(fixture)).toEqual([
      'Debe tener entre 4 y 20 letras o números, sin espacios',
      'Debe tener al menos 2 caracteres',
      'Este campo es obligatorio',
      'El correo debe tener el formato xxxx@xxxxx.xxx',
      'El cliente debe ser mayor de edad (18 años cumplidos)',
    ]);
  });

  it('loads the customer and saves the changes when editing', async () => {
    customerService.getById.mockReturnValue(of(ANA));
    customerService.update.mockReturnValue(of({ ...ANA, email: 'ana@nuevo.com' }));
    const fixture = await render('1');

    expect(customerService.getById).toHaveBeenCalledWith(1);
    expect((fixture.nativeElement as HTMLElement).querySelector('h1')?.textContent).toBe('Editar cliente');

    type(fixture, 'email', 'ana@nuevo.com');
    await submit(fixture);

    expect(customerService.update).toHaveBeenCalledWith(1, { ...ANA_DATA, email: 'ana@nuevo.com' });
    expect(notifications.success).toHaveBeenCalledWith('Cliente Ana María Gómez actualizado');
  });

  it('stays on the form when the API rejects the data', async () => {
    customerService.create.mockReturnValue(throwError(() => new Error('409')));
    const fixture = await render();

    fill(fixture);
    await submit(fixture);

    expect(notifications.success).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('button[type=submit]')!
        .disabled,
    ).toBe(false);
  });

  it('goes back to the list when the customer to edit does not exist', async () => {
    customerService.getById.mockReturnValue(throwError(() => new Error('404')));
    await render('99');

    expect(router.navigate).toHaveBeenCalledWith(['/customers']);
  });
});
