import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../../core/http/api.config';
import { Account, OpenAccountRequest } from '../../core/models/account';

@Injectable({ providedIn: 'root' })
export class AccountService {
  private readonly http = inject(HttpClient);

  getByCustomer(customerId: number): Observable<Account[]> {
    return this.http.get<Account[]>(`${API_URL}/customers/${customerId}/accounts`);
  }

  /** The API generates the number (53 savings, 33 checking) and opens the account as active. */
  open(request: OpenAccountRequest): Observable<Account> {
    return this.http.post<Account>(`${API_URL}/accounts`, request);
  }
}
