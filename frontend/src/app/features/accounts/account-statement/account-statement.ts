import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink } from '@angular/router';
import { finalize, map, switchMap } from 'rxjs';
import { TransactionType } from '../../../core/models/enums';
import { AccountStatement as Statement } from '../../../core/models/transaction';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { PageHeader } from '../../../shared/components/page-header/page-header';
import { AccountNumberPipe } from '../../../shared/pipes/account-number.pipe';
import { LabelPipe } from '../../../shared/pipes/label.pipe';
import { CustomerService } from '../../customers/customer.service';
import { TransactionService } from '../../transactions/transaction.service';
import { AccountCard } from '../account-card/account-card';
import { statementCsv } from './statement-csv';

type Filter = 'ALL' | TransactionType;

/** Movements of one account with their running balance, totals and a CSV download (RF-24). */
@Component({
  selector: 'app-account-statement',
  imports: [
    AccountCard,
    AccountNumberPipe,
    CurrencyPipe,
    DatePipe,
    EmptyState,
    LabelPipe,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatProgressBarModule,
    MatTableModule,
    MatTooltipModule,
    PageHeader,
    RouterLink,
  ],
  templateUrl: './account-statement.html',
  styleUrl: './account-statement.scss',
})
export class AccountStatement implements OnInit {
  private readonly transactionService = inject(TransactionService);
  private readonly customerService = inject(CustomerService);
  private readonly router = inject(Router);

  /** Route parameter. */
  readonly id = input.required<string>();

  protected readonly statement = signal<Statement | null>(null);
  protected readonly ownerName = signal('');
  protected readonly loading = signal(true);
  protected readonly filter = signal<Filter>('ALL');

  protected readonly columns = ['date', 'movement', 'reference', 'debit', 'credit', 'balance'];
  protected readonly filters: { value: Filter; label: string }[] = [
    { value: 'ALL', label: 'Todos' },
    { value: 'DEPOSIT', label: 'Consignaciones' },
    { value: 'WITHDRAWAL', label: 'Retiros' },
    { value: 'TRANSFER', label: 'Transferencias' },
    { value: 'GMF', label: 'GMF 4x1000' },
  ];

  protected readonly movements = computed(() => {
    const all = this.statement()?.transactions ?? [];
    const filter = this.filter();
    return filter === 'ALL' ? all : all.filter((movement) => movement.type === filter);
  });

  /** Totals of every movement of the account, whatever the filter. */
  protected readonly totals = computed(() => {
    const all = this.statement()?.transactions ?? [];
    const sum = (predicate: (t: (typeof all)[number]) => boolean) =>
      all.filter(predicate).reduce((total, t) => total + t.amount, 0);
    return {
      credits: sum((t) => t.entryType === 'CREDIT'),
      debits: sum((t) => t.entryType === 'DEBIT'),
      gmf: sum((t) => t.type === 'GMF'),
      count: all.length,
    };
  });

  ngOnInit(): void {
    this.transactionService
      .getStatement(Number(this.id()))
      .pipe(
        switchMap((statement) =>
          this.customerService
            .getById(statement.account.customerId)
            .pipe(map((customer) => ({ statement, customer }))),
        ),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: ({ statement, customer }) => {
          this.statement.set(statement);
          this.ownerName.set(`${customer.firstName} ${customer.lastName}`);
        },
        error: () => this.router.navigate(['/customers']),
      });
  }

  protected download(): void {
    const statement = this.statement()!;
    const blob = new Blob([statementCsv(this.movements())], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `estado-cuenta-${statement.account.accountNumber}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }
}
