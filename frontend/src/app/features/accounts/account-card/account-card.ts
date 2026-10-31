import { CurrencyPipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Account } from '../../../core/models/account';
import { StatusChip } from '../../../shared/components/status-chip/status-chip';
import { AccountNumberPipe } from '../../../shared/pipes/account-number.pipe';
import { LabelPipe } from '../../../shared/pipes/label.pipe';

/** An account drawn like a bank card: navy for savings, teal for checking, grey when not active. */
@Component({
  selector: 'app-account-card',
  imports: [AccountNumberPipe, CurrencyPipe, LabelPipe, MatIconModule, StatusChip],
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
}
