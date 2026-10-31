import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { filter, finalize, switchMap } from 'rxjs';
import { Customer } from '../../../core/models/customer';
import { NotificationService } from '../../../core/notification/notification.service';
import { ConfirmService } from '../../../shared/components/confirm-dialog/confirm.service';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { PageHeader } from '../../../shared/components/page-header/page-header';
import { CustomerService } from '../customer.service';

@Component({
  selector: 'app-customer-list',
  imports: [
    DatePipe,
    EmptyState,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatTableModule,
    MatTooltipModule,
    PageHeader,
    RouterLink,
  ],
  templateUrl: './customer-list.html',
  styleUrl: './customer-list.scss',
})
export class CustomerList implements OnInit {
  private readonly customerService = inject(CustomerService);
  private readonly confirmService = inject(ConfirmService);
  private readonly notifications = inject(NotificationService);

  protected readonly columns = ['identification', 'name', 'email', 'birthDate', 'createdAt', 'actions'];
  protected readonly customers = signal<Customer[]>([]);
  protected readonly loading = signal(true);
  protected readonly search = signal('');

  /** Matches name, identification number or email, ignoring case and accents. */
  protected readonly filtered = computed(() => {
    const term = normalize(this.search());
    return this.customers().filter((customer) =>
      normalize(
        `${customer.firstName} ${customer.lastName} ${customer.identificationNumber} ${customer.email}`,
      ).includes(term),
    );
  });

  protected readonly subtitle = computed(() => {
    const total = this.customers().length;
    return total === 1 ? '1 cliente registrado' : `${total} clientes registrados`;
  });

  ngOnInit(): void {
    this.load();
  }

  protected delete(customer: Customer): void {
    const name = `${customer.firstName} ${customer.lastName}`;
    this.confirmService
      .confirm({
        title: 'Eliminar cliente',
        message: `¿Desea eliminar a ${name}? Esta acción no se puede deshacer.`,
        confirmText: 'Eliminar',
        destructive: true,
      })
      .pipe(
        filter(Boolean),
        switchMap(() => this.customerService.delete(customer.id)),
      )
      .subscribe({
        next: () => {
          this.notifications.success(`Cliente ${name} eliminado`);
          this.customers.update((list) => list.filter((item) => item.id !== customer.id));
        },
        // The error interceptor already told the user why (e.g. the customer has accounts)
        error: () => undefined,
      });
  }

  private load(): void {
    this.loading.set(true);
    this.customerService
      .getAll()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({ next: (customers) => this.customers.set(customers), error: () => undefined });
  }
}

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}
