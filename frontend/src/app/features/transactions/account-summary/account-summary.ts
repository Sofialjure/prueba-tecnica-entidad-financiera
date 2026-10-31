import { CurrencyPipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { LabelPipe } from '../../../shared/pipes/label.pipe';
import { AccountOption } from '../account-option';

/** Owner, type, GMF condition and available balance of the account chosen in a form. */
@Component({
  selector: 'app-account-summary',
  imports: [CurrencyPipe, LabelPipe, MatIconModule],
  host: { class: 'account-summary' },
  template: `
    @let account = option().account;
    <span class="summary-icon" [class.checking]="account.accountType === 'CHECKING'">
      <mat-icon>{{ account.accountType === 'SAVINGS' ? 'savings' : 'account_balance' }}</mat-icon>
    </span>
    <div class="summary-text">
      <strong>{{ option().ownerName }}</strong>
      <span>
        {{ account.accountType | label: 'accountTypeName' }} ·
        {{ account.gmfExempt ? 'Exenta GMF' : 'Paga GMF 4x1000' }}
      </span>
    </div>
    <div class="summary-balance">
      <span>Disponible</span>
      <strong>{{ account.availableBalance | currency: 'COP' : 'symbol-narrow' : '1.2-2' }}</strong>
      @if (account.accountType === 'CHECKING') {
        <small class="split">
          Saldo {{ account.balance | currency: 'COP' : 'symbol-narrow' : '1.0-2' }} + cupo
          {{ account.overdraftLimit | currency: 'COP' : 'symbol-narrow' : '1.0-0' }}
        </small>
        @if (account.balance < 0) {
          <small class="in-use">
            Sobregiro en uso: {{ -account.balance | currency: 'COP' : 'symbol-narrow' : '1.0-2' }}
          </small>
        }
      }
    </div>
  `,
  styleUrl: './account-summary.scss',
})
export class AccountSummary {
  readonly option = input.required<AccountOption>();
}
