import { Component, input } from '@angular/core';
import { AccountStatus } from '../../../core/models/enums';
import { LabelPipe } from '../../pipes/label.pipe';

/** Colored badge with the account status: green active, amber inactive, grey cancelled. */
@Component({
  selector: 'app-status-chip',
  imports: [LabelPipe],
  template: `<span class="chip" [class]="status().toLowerCase()">{{ status() | label: 'accountStatus' }}</span>`,
  styles: `
    .chip {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 12px;
      font: var(--mat-sys-label-medium);
    }
    .active {
      background: #d7f5dd;
      color: #0d5c1f;
    }
    .inactive {
      background: #fff0c2;
      color: #6b4f00;
    }
    .cancelled {
      background: var(--mat-sys-surface-container-highest);
      color: var(--mat-sys-on-surface-variant);
    }
  `,
})
export class StatusChip {
  readonly status = input.required<AccountStatus>();
}
