import { Component, computed, input } from '@angular/core';

/** Soft background / strong text pairs; each person always gets the same one. */
const COLORS: [string, string][] = [
  ['#dce5f7', '#16305f'],
  ['#fdf0cf', '#7a5600'],
  ['#d7f5dd', '#0d5c1f'],
  ['#fde2e1', '#8c1d18'],
  ['#e9e0fb', '#4a2a8a'],
  ['#d5f1f4', '#0c5a63'],
];

/** Circle with the initials of a person: "Ana María Gómez" → "AG". */
@Component({
  selector: 'app-avatar',
  template: `{{ initials() }}`,
  host: {
    '[style.background]': 'color()[0]',
    '[style.color]': 'color()[1]',
    '[attr.aria-hidden]': 'true',
  },
  styles: `
    :host {
      display: inline-grid;
      place-items: center;
      flex-shrink: 0;
      width: 38px;
      height: 38px;
      border-radius: 50%;
      font-size: 14px;
      font-weight: 700;
    }
  `,
})
export class Avatar {
  readonly firstName = input.required<string>();
  readonly lastName = input.required<string>();

  protected readonly initials = computed(
    () => `${this.firstName().trim().charAt(0)}${this.lastName().trim().charAt(0)}`.toUpperCase(),
  );

  protected readonly color = computed(() => {
    const name = `${this.firstName()} ${this.lastName()}`;
    const hash = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return COLORS[hash % COLORS.length];
  });
}
