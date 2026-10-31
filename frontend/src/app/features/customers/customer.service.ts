import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../../core/http/api.config';
import { Customer } from '../../core/models/customer';

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/customers`;

  getAll(): Observable<Customer[]> {
    return this.http.get<Customer[]>(this.url);
  }

  /** The API answers 409 when the customer still has accounts (RF-04). */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
