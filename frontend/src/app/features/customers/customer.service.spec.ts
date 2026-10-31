import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CustomerService } from './customer.service';

describe('CustomerService', () => {
  let service: CustomerService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(CustomerService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('lists customers', () => {
    service.getAll().subscribe();

    expect(httpTesting.expectOne('/api/v1/customers').request.method).toBe('GET');
  });

  it('reads, creates and updates customers', () => {
    const data = {
      identificationType: 'CC' as const,
      identificationNumber: '1020304050',
      firstName: 'Ana María',
      lastName: 'Gómez',
      email: 'ana.gomez@correo.com',
      birthDate: '1995-04-12',
    };
    service.getById(1).subscribe();
    service.create(data).subscribe();
    service.update(1, data).subscribe();

    expect(httpTesting.expectOne({ method: 'GET', url: '/api/v1/customers/1' })).toBeTruthy();
    expect(httpTesting.expectOne({ method: 'POST', url: '/api/v1/customers' }).request.body).toEqual(data);
    expect(httpTesting.expectOne({ method: 'PUT', url: '/api/v1/customers/1' }).request.body).toEqual(data);
  });

  it('deletes a customer by id', () => {
    service.delete(7).subscribe();

    expect(httpTesting.expectOne('/api/v1/customers/7').request.method).toBe('DELETE');
  });
});
