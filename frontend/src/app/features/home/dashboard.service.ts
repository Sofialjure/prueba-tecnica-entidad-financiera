import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { forkJoin, map, Observable } from 'rxjs';
import { API_URL } from '../../core/http/api.config';
import { Account } from '../../core/models/account';
import { Customer } from '../../core/models/customer';

export interface DashboardSummary {
  customers: number;
  activeAccounts: number;
  totalAccounts: number;
  /** Sum of the balances of every account that is not cancelled. */
  totalBalance: number;
  /** Five most recently registered customers, newest first. */
  recentCustomers: Customer[];
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);

  summary(): Observable<DashboardSummary> {
    return forkJoin({
      customers: this.http.get<Customer[]>(`${API_URL}/customers`),
      accounts: this.http.get<Account[]>(`${API_URL}/accounts`),
    }).pipe(map(({ customers, accounts }) => summarize(customers, accounts)));
  }
}

export function summarize(customers: Customer[], accounts: Account[]): DashboardSummary {
  const open = accounts.filter((account) => account.status !== 'CANCELLED');
  return {
    customers: customers.length,
    activeAccounts: accounts.filter((account) => account.status === 'ACTIVE').length,
    totalAccounts: accounts.length,
    totalBalance: open.reduce((sum, account) => sum + account.balance, 0),
    recentCustomers: [...customers]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id)
      .slice(0, 5),
  };
}
