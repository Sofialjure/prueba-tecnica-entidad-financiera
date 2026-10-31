import { CurrencyPipe } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { RouterLink } from '@angular/router';
import { Account, AccountAction } from '../../../core/models/account';
import { StatusChip } from '../../../shared/components/status-chip/status-chip';
import { AccountNumberPipe } from '../../../shared/pipes/account-number.pipe';
import { LabelPipe } from '../../../shared/pipes/label.pipe';

/**
 * An account drawn like a bank card: navy for savings, teal for checking, grey when not active.
 * Its menu only offers the status changes allowed from the current status (SUP-04).
 */
@Component({
  selector: 'app-account-card',
  imports: [
    AccountNumberPipe,
    CurrencyPipe,
    LabelPipe,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    MatMenuModule,
    RouterLink,
    StatusChip,
  ],
  templateUrl: './account-card.html',
  styleUrl: './account-card.scss',
  host: {
    '[class.savings]': "account().accountType === 'SAVINGS'",
    '[class.checking]': "account().accountType === 'CHECKING'",
    '[class.not-active]': "account().status !== 'ACTIVE'",
  },
})
export class AccountCard {
  readonly account = input.required<Account>();
  /** False to show the card alone, e.g. as the header of the statement. */
  readonly actions = input(true);
  readonly statusChange = output<AccountAction>();

  /** How negative a checking account is, out of its overdraft line (SUP-01). */
  protected readonly overdraftInUse = computed(() => Math.max(0, -this.account().balance));
  protected readonly overdraftPercent = computed(() => {
    const limit = this.account().overdraftLimit;
    return limit > 0 ? Math.min(100, (this.overdraftInUse() / limit) * 100) : 0;
  });
}
