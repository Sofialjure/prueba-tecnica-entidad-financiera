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

  it('deletes a customer by id', () => {
    service.delete(7).subscribe();

    expect(httpTesting.expectOne('/api/v1/customers/7').request.method).toBe('DELETE');
  });
});
