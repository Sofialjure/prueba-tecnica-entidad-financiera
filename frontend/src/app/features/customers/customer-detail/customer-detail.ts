import { DatePipe } from '@angular/common';
import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink } from '@angular/router';
import { filter, finalize, forkJoin, switchMap } from 'rxjs';
import { Account, AccountAction } from '../../../core/models/account';
import { Customer } from '../../../core/models/customer';
import { NotificationService } from '../../../core/notification/notification.service';
import { Avatar } from '../../../shared/components/avatar/avatar';
import { ConfirmDialogData } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { ConfirmService } from '../../../shared/components/confirm-dialog/confirm.service';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { LABELS } from '../../../shared/labels';
import { AccountNumberPipe } from '../../../shared/pipes/account-number.pipe';
import { LabelPipe } from '../../../shared/pipes/label.pipe';
import { AccountCard } from '../../accounts/account-card/account-card';
import { AccountService } from '../../accounts/account.service';
import {
  OpenAccountDialog,
  OpenAccountDialogData,
} from '../../accounts/open-account-dialog/open-account-dialog';
import { CustomerService } from '../customer.service';

/** Confirmation text and result message of each status change. */
const STATUS_CHANGES: Record<
  AccountAction,
  { confirm: (number: string) => ConfirmDialogData; done: string }
> = {
  deactivate: {
    confirm: (number) => ({
      title: 'Inactivar cuenta',
      message: `La cuenta ${number} dejará de permitir consignaciones, retiros y transferencias hasta que se active de nuevo.`,
      confirmText: 'Inactivar',
    }),
    done: 'inactivada',
  },
  activate: {
    confirm: (number) => ({
      title: 'Activar cuenta',
      message: `La cuenta ${number} volverá a permitir movimientos.`,
      confirmText: 'Activar',
    }),
    done: 'activada',
  },
  cancel: {
    confirm: (number) => ({
      title: 'Cancelar cuenta',
      message: `La cuenta ${number} quedará cancelada de forma definitiva y no se podrá volver a activar.`,
      confirmText: 'Cancelar cuenta',
      destructive: true,
    }),
    done: 'cancelada',
  },
};

/** Profile of one customer with the accounts they own (RF-19). */
@Component({
  selector: 'app-customer-detail',
  imports: [
    AccountCard,
    Avatar,
    DatePipe,
    EmptyState,
    LabelPipe,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule,
    RouterLink,
  ],
  templateUrl: './customer-detail.html',
  styleUrl: './customer-detail.scss',
})
export class CustomerDetail implements OnInit {
  private readonly customerService = inject(CustomerService);
  private readonly accountService = inject(AccountService);
  private readonly dialog = inject(MatDialog);
  private readonly confirmService = inject(ConfirmService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly accountNumber = new AccountNumberPipe();

  /** Route parameter. */
  readonly id = input.required<string>();

  protected readonly customer = signal<Customer | null>(null);
  protected readonly accounts = signal<Account[]>([]);
  protected readonly loading = signal(true);

  protected readonly accountsSubtitle = computed(() => {
    const total = this.accounts().length;
    return total === 1 ? '1 cuenta' : `${total} cuentas`;
  });

  ngOnInit(): void {
    const id = Number(this.id());
    forkJoin({
      customer: this.customerService.getById(id),
      accounts: this.accountService.getByCustomer(id),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ customer, accounts }) => {
          this.customer.set(customer);
          this.accounts.set(accounts);
        },
        error: () => this.router.navigate(['/customers']),
      });
  }

  protected changeStatus(account: Account, action: AccountAction): void {
    const number = this.accountNumber.transform(account.accountNumber);
    const change = STATUS_CHANGES[action];
    this.confirmService
      .confirm(change.confirm(number))
      .pipe(
        filter(Boolean),
        switchMap(() => this.accountService.changeStatus(account.id, action)),
      )
      .subscribe({
        next: (updated) => {
          this.accounts.update((list) => list.map((item) => (item.id === updated.id ? updated : item)));
          this.notifications.success(`Cuenta ${number} ${change.done}`);
        },
        // The error interceptor already showed why the API refused (e.g. balance not $0)
        error: () => undefined,
      });
  }

  /** Types with an active or inactive account; cancelled ones do not count (SUP-15). */
  protected readonly takenTypes = computed(() => [
    ...new Set(
      this.accounts()
        .filter((account) => account.status !== 'CANCELLED')
        .map((account) => account.accountType),
    ),
  ]);
  protected readonly canOpenAccount = computed(() => this.takenTypes().length < 2);

  protected openAccount(): void {
    const customer = this.customer()!;
    this.dialog
      .open<OpenAccountDialog, OpenAccountDialogData, Account>(OpenAccountDialog, {
        data: {
          customerId: customer.id,
          customerName: `${customer.firstName} ${customer.lastName}`,
          takenTypes: this.takenTypes(),
        },
        width: '520px',
      })
      .afterClosed()
      .pipe(filter((account): account is Account => !!account))
      .subscribe((account) => {
        this.accounts.update((list) => [...list, account]);
        this.notifications.success(
          `${LABELS.accountTypeName[account.accountType]} ${this.accountNumber.transform(account.accountNumber)} abierta`,
        );
      });
  }
}
