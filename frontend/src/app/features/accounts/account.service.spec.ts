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

  it('lists the accounts of a customer', () => {
    service.getByCustomer(3).subscribe();

    expect(httpTesting.expectOne('/api/v1/customers/3/accounts').request.method).toBe('GET');
  });

  it('opens an account', () => {
    const request = { customerId: 3, accountType: 'CHECKING' as const, overdraftLimit: 300000, gmfExempt: true };

    service.open(request).subscribe();

    const call = httpTesting.expectOne('/api/v1/accounts');
    expect(call.request.method).toBe('POST');
    expect(call.request.body).toEqual(request);
  });
});
