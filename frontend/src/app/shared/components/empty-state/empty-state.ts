import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/** Message shown instead of an empty table; an optional action button goes inside the tag. */
@Component({
  selector: 'app-empty-state',
  imports: [MatIconModule],
  template: `
    <span class="icon-circle"><mat-icon>{{ icon() }}</mat-icon></span>
    <p>{{ message() }}</p>
    <ng-content />
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 56px 16px;
      text-align: center;
      color: var(--app-text-muted);
    }
    .icon-circle {
      display: grid;
      place-items: center;
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: var(--mat-sys-primary-container);
      color: var(--mat-sys-primary);
    }
    mat-icon {
      width: 36px;
      height: 36px;
      font-size: 36px;
    }
    p {
      margin: 0;
      font-size: 15px;
    }
  `,
})
export class EmptyState {
  readonly icon = input('inbox');
  readonly message = input.required<string>();
}
