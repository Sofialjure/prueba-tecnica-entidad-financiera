import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/** Message shown instead of an empty table; an optional action button goes inside the tag. */
@Component({
  selector: 'app-empty-state',
  imports: [MatIconModule],
  template: `
    <mat-icon class="icon">{{ icon() }}</mat-icon>
    <p>{{ message() }}</p>
    <ng-content />
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 48px 16px;
      text-align: center;
      color: var(--mat-sys-on-surface-variant);
    }
    .icon {
      width: 48px;
      height: 48px;
      font-size: 48px;
    }
  `,
})
export class EmptyState {
  readonly icon = input('inbox');
  readonly message = input.required<string>();
}
