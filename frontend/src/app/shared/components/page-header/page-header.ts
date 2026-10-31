import { Component, input } from '@angular/core';

/** Title of a screen with an optional subtitle; action buttons go inside the tag. */
@Component({
  selector: 'app-page-header',
  template: `
    <div class="text">
      <h1>{{ title() }}</h1>
      @if (subtitle()) {
        <p class="subtitle">{{ subtitle() }}</p>
      }
    </div>
    <div class="actions"><ng-content /></div>
  `,
  styles: `
    :host {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 24px;
    }
    h1 {
      margin: 0;
      font: var(--mat-sys-headline-small);
    }
    .subtitle {
      margin: 4px 0 0;
      color: var(--mat-sys-on-surface-variant);
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
  `,
})
export class PageHeader {
  readonly title = input.required<string>();
  readonly subtitle = input<string>();
}
