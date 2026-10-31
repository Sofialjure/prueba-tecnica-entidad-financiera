import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AccountService } from './account.service';

describe('AccountService', () => {
  let service: AccountService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(AccountService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('lists every account', () => {
    service.getAll().subscribe();

    expect(httpTesting.expectOne('/api/v1/accounts').request.method).toBe('GET');
  });

  it('lists the accounts of a customer', () => {
    service.getByCustomer(3).subscribe();

    expect(httpTesting.expectOne('/api/v1/customers/3/accounts').request.method).toBe('GET');
  });

  it.each(['activate', 'deactivate', 'cancel'] as const)('changes the status with %s', (action) => {
    service.changeStatus(5, action).subscribe();

    expect(httpTesting.expectOne(`/api/v1/accounts/5/${action}`).request.method).toBe('PATCH');
  });

  it('opens an account', () => {
    const request = { customerId: 3, accountType: 'CHECKING' as const, overdraftLimit: 300000, gmfExempt: true };

    service.open(request).subscribe();

    const call = httpTesting.expectOne('/api/v1/accounts');
    expect(call.request.method).toBe('POST');
    expect(call.request.body).toEqual(request);
  });
});
