import { Directive, ElementRef, forwardRef, inject } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

const MAX_DECIMALS = 2;

/**
 * Money field written the Colombian way while typing: dots for thousands and a comma for
 * decimals (`1250000,5` → `1.250.000,5`). The form control keeps a plain number (1250000.5).
 *
 * Usage: `<input matInput appMoneyInput formControlName="amount" />`
 */
@Directive({
  selector: 'input[appMoneyInput]',
  host: {
    type: 'text',
    inputmode: 'decimal',
    autocomplete: 'off',
    '(input)': 'onInput()',
    '(blur)': 'onTouched()',
  },
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => MoneyInput), multi: true },
  ],
})
export class MoneyInput implements ControlValueAccessor {
  private readonly input = inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;
  private onChange: (value: number | null) => void = () => undefined;
  protected onTouched: () => void = () => undefined;

  writeValue(value: number | null): void {
    this.input.value = value === null || value === undefined ? '' : formatMoney(value);
  }

  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.input.disabled = disabled;
  }

  protected onInput(): void {
    const raw = this.input.value;
    // Keep the caret after the same digit it was after, although dots are added or removed
    const caret = this.input.selectionStart ?? raw.length;
    const significantBeforeCaret = countSignificant(raw.slice(0, caret));

    const text = formatTyping(raw);
    this.input.value = text;
    const position = caretAfterSignificant(text, significantBeforeCaret);
    this.input.setSelectionRange(position, position);

    this.onChange(parseMoney(text));
  }
}

/** 1250000.5 → "1.250.000,5" (at most two decimals, without trailing zeros). */
export function formatMoney(value: number): string {
  const [integer, decimals] = (Math.round(value * 100) / 100).toString().split('.');
  return groupThousands(integer) + (decimals ? `,${decimals}` : '');
}

/** Cleans what the user typed: only digits and one decimal comma; dots are added back. */
export function formatTyping(raw: string): string {
  const cleaned = raw.replace(/[^\d,]/g, '');
  const commaAt = cleaned.indexOf(',');
  const integerDigits = (commaAt === -1 ? cleaned : cleaned.slice(0, commaAt)).replace(
    /^0+(?=\d)/,
    '',
  );
  if (commaAt === -1) {
    return groupThousands(integerDigits);
  }
  const decimals = cleaned
    .slice(commaAt + 1)
    .replace(/,/g, '')
    .slice(0, MAX_DECIMALS);
  return `${groupThousands(integerDigits || '0')},${decimals}`;
}

/** "1.250.000,5" → 1250000.5; empty → null. */
export function parseMoney(text: string): number | null {
  const normalized = text.replace(/\./g, '').replace(',', '.');
  if (!/\d/.test(normalized)) {
    return null;
  }
  return Number(normalized);
}

function groupThousands(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function countSignificant(text: string): number {
  return text.replace(/[^\d,]/g, '').length;
}

function caretAfterSignificant(text: string, significant: number): number {
  let seen = 0;
  for (let index = 0; index < text.length; index++) {
    if (seen === significant) {
      return index;
    }
    if (/[\d,]/.test(text[index])) {
      seen++;
    }
  }
  return text.length;
}
