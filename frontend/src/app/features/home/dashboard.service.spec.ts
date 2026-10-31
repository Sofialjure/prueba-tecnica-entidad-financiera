import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Account } from '../../core/models/account';
import { Customer } from '../../core/models/customer';
import { DashboardService, DashboardSummary, summarize } from './dashboard.service';

const customer = (id: number, createdAt: string): Customer => ({
  id,
  identificationType: 'CC',
  identificationNumber: `${id}000`,
  firstName: `Nombre${id}`,
  lastName: 'Apellido',
  email: `c${id}@correo.com`,
  birthDate: '1990-01-01',
  createdAt,
  updatedAt: createdAt,
});

const account = (status: Account['status'], balance: number): Account => ({
  id: 1,
  accountType: 'SAVINGS',
  accountNumber: '5300000001',
  status,
  balance,
  overdraftLimit: 0,
  availableBalance: balance,
  gmfExempt: false,
  customerId: 1,
  createdAt: '2026-10-01T08:00:00',
  updatedAt: '2026-10-01T08:00:00',
});

describe('summarize', () => {
  it('counts customers and active accounts and adds the balance of open accounts', () => {
    const summary = summarize(
      [customer(1, '2026-10-01T08:00:00')],
      [account('ACTIVE', 1799200), account('INACTIVE', -50000), account('CANCELLED', 0)],
    );

    expect(summary.customers).toBe(1);
    expect(summary.activeAccounts).toBe(1);
    expect(summary.totalAccounts).toBe(3);
    expect(summary.totalBalance).toBe(1749200);
  });

  it('lists the five newest customers first', () => {
    const customers = [1, 2, 3, 4, 5, 6].map((id) => customer(id, `2026-10-0${id}T08:00:00`));

    expect(summarize(customers, []).recentCustomers.map((c) => c.id)).toEqual([6, 5, 4, 3, 2]);
  });
});

describe('DashboardService', () => {
  it('reads customers and accounts from the API', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const httpTesting = TestBed.inject(HttpTestingController);
    let result: DashboardSummary | undefined;

    TestBed.inject(DashboardService)
      .summary()
      .subscribe((summary) => (result = summary));
    httpTesting.expectOne('/api/v1/customers').flush([customer(1, '2026-10-01T08:00:00')]);
    httpTesting.expectOne('/api/v1/accounts').flush([account('ACTIVE', 500)]);

    expect(result?.customers).toBe(1);
    expect(result?.totalBalance).toBe(500);
    httpTesting.verify();
  });
});
