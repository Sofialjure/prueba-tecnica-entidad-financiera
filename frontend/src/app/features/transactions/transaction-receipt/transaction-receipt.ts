import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TransactionReceipt } from '../../../core/models/transaction';
import { AccountNumberPipe } from '../../../shared/pipes/account-number.pipe';
import { LabelPipe } from '../../../shared/pipes/label.pipe';

/** Proof of a finished operation: every movement it generated and the balance after each one. */
@Component({
  selector: 'app-transaction-receipt',
  imports: [AccountNumberPipe, CurrencyPipe, DatePipe, LabelPipe, MatIconModule],
  templateUrl: './transaction-receipt.html',
  styleUrl: './transaction-receipt.scss',
})
export class TransactionReceiptView {
  readonly receipt = input.required<TransactionReceipt>();

  protected readonly date = computed(() => this.receipt().entries[0]?.createdAt);
}
