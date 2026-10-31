import { Component, inject, input, linkedSignal, OnInit, signal } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { finalize, forkJoin } from 'rxjs';
import { TransactionReceipt } from '../../../core/models/transaction';
import { PageHeader } from '../../../shared/components/page-header/page-header';
import { AccountService } from '../../accounts/account.service';
import { CustomerService } from '../../customers/customer.service';
import { AccountOption, activeAccountOptions } from '../account-option';
import { MovementForm, MovementKind } from '../movement-form/movement-form';
import { TransactionReceiptView } from '../transaction-receipt/transaction-receipt';

/** Deposits and withdrawals. `?type=withdrawal&account=5300000001` preselects both. */
@Component({
  selector: 'app-transactions-page',
  imports: [
    MatButtonToggleModule,
    MatIconModule,
    MatProgressBarModule,
    MovementForm,
    PageHeader,
    TransactionReceiptView,
  ],
  templateUrl: './transactions-page.html',
  styleUrl: './transactions-page.scss',
})
export class TransactionsPage implements OnInit {
  private readonly accountService = inject(AccountService);
  private readonly customerService = inject(CustomerService);

  /** Query parameters. */
  readonly type = input<string>();
  readonly account = input<string>();

  protected readonly kind = linkedSignal<MovementKind>(() =>
    this.type() === 'withdrawal' ? 'withdrawal' : 'deposit',
  );
  protected readonly options = signal<AccountOption[]>([]);
  protected readonly loading = signal(true);
  protected readonly receipt = signal<TransactionReceipt | null>(null);

  ngOnInit(): void {
    this.loadAccounts();
  }

  protected changeKind(kind: MovementKind): void {
    this.kind.set(kind);
    this.receipt.set(null);
  }

  protected showReceipt(receipt: TransactionReceipt): void {
    this.receipt.set(receipt);
    // Balances changed: refresh them so the next operation validates against the new ones
    this.loadAccounts();
  }

  private loadAccounts(): void {
    this.loading.set(true);
    forkJoin({
      accounts: this.accountService.getAll(),
      customers: this.customerService.getAll(),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ accounts, customers }) =>
          this.options.set(activeAccountOptions(accounts, customers)),
        error: () => undefined,
      });
  }
}
