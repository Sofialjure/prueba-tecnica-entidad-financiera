import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { TransactionService } from './transaction.service';

describe('TransactionService', () => {
  let service: TransactionService;
  let httpTesting: HttpTestingController;
  const request = { accountNumber: '5300000001', amount: 50000, description: 'Nómina' };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TransactionService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('posts deposits', () => {
    service.deposit(request).subscribe();

    const call = httpTesting.expectOne({ method: 'POST', url: '/api/v1/transactions/deposits' });
    expect(call.request.body).toEqual(request);
  });

  it('posts withdrawals', () => {
    service.withdraw(request).subscribe();

    const call = httpTesting.expectOne({ method: 'POST', url: '/api/v1/transactions/withdrawals' });
    expect(call.request.body).toEqual(request);
  });
});
