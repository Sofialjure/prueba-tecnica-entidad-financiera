import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../../core/http/api.config';
import { MovementRequest, TransactionReceipt } from '../../core/models/transaction';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/transactions`;

  /** Credit movement (RF-20). */
  deposit(request: MovementRequest): Observable<TransactionReceipt> {
    return this.http.post<TransactionReceipt>(`${this.url}/deposits`, request);
  }

  /** Debit movement plus the 4x1000 on non-exempt accounts (RF-21, SUP-10). */
  withdraw(request: MovementRequest): Observable<TransactionReceipt> {
    return this.http.post<TransactionReceipt>(`${this.url}/withdrawals`, request);
  }
}
