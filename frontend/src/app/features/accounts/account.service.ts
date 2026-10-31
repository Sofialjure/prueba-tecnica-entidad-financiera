import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../../core/http/api.config';
import { Account, AccountAction, OpenAccountRequest } from '../../core/models/account';

@Injectable({ providedIn: 'root' })
export class AccountService {
  private readonly http = inject(HttpClient);

  getAll(): Observable<Account[]> {
    return this.http.get<Account[]>(`${API_URL}/accounts`);
  }

  getByCustomer(customerId: number): Observable<Account[]> {
    return this.http.get<Account[]>(`${API_URL}/customers/${customerId}/accounts`);
  }

  /** The API generates the number (53 savings, 33 checking) and opens the account as active. */
  open(request: OpenAccountRequest): Observable<Account> {
    return this.http.post<Account>(`${API_URL}/accounts`, request);
  }

  /**
   * The API answers 422 when the change is not allowed: reactivating a cancelled account
   * (SUP-04) or cancelling one whose balance is not exactly $0 (RF-16).
   */
  changeStatus(id: number, action: AccountAction): Observable<Account> {
    return this.http.patch<Account>(`${API_URL}/accounts/${id}/${action}`, null);
  }
}
