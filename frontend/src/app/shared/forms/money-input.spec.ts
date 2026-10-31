import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { formatMoney, formatTyping, MoneyInput, parseMoney } from './money-input';

describe('money input formatting', () => {
  it('adds thousand dots while typing', () => {
    expect(formatTyping('6000')).toBe('6.000');
    expect(formatTyping('6600')).toBe('6.600');
    expect(formatTyping('1250000')).toBe('1.250.000');
    expect(formatTyping('999')).toBe('999');
  });

  it('moves the dots when digits are added or removed', () => {
    expect(formatTyping('1.25000')).toBe('125.000');
    expect(formatTyping('12.50')).toBe('1.250');
  });

  it('keeps one decimal comma with up to two decimals', () => {
    expect(formatTyping('6000,')).toBe('6.000,');
    expect(formatTyping('6000,5')).toBe('6.000,5');
    expect(formatTyping('6000,559')).toBe('6.000,55');
    expect(formatTyping('6,0,1')).toBe('6,01');
    expect(formatTyping(',5')).toBe('0,5');
  });

  it('ignores letters, signs and leading zeros', () => {
    expect(formatTyping('-$ 12a34')).toBe('1.234');
    expect(formatTyping('0007')).toBe('7');
    expect(formatTyping('')).toBe('');
  });

  it('reads the typed text as a number', () => {
    expect(parseMoney('1.250.000,5')).toBe(1250000.5);
    expect(parseMoney('6.000')).toBe(6000);
    expect(parseMoney('')).toBeNull();
  });

  it('shows numbers coming from the form in the same format', () => {
    expect(formatMoney(1250000.5)).toBe('1.250.000,5');
    expect(formatMoney(500000)).toBe('500.000');
    expect(formatMoney(0)).toBe('0');
  });
});

@Component({
  imports: [MoneyInput, ReactiveFormsModule],
  template: `<input appMoneyInput [formControl]="amount" />`,
})
class Host {
  readonly amount = new FormControl<number | null>(500000);
}

describe('MoneyInput', () => {
  it('shows the control value with dots and gives the control a plain number', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const input = (fixture.nativeElement as HTMLElement).querySelector('input')!;

    expect(input.value).toBe('500.000');
    expect(input.getAttribute('inputmode')).toBe('decimal');

    input.value = '6600';
    input.dispatchEvent(new Event('input'));

    expect(input.value).toBe('6.600');
    expect(fixture.componentInstance.amount.value).toBe(6600);

    input.value = '';
    input.dispatchEvent(new Event('input'));
    expect(fixture.componentInstance.amount.value).toBeNull();
  });

  it('keeps the caret after the digit being typed when dots shift', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const input = (fixture.nativeElement as HTMLElement).querySelector('input')!;

    // "500.000" with a "1" typed right after the 5 → "5100.000", caret after the 1
    input.value = '5100.000';
    input.setSelectionRange(2, 2);
    input.dispatchEvent(new Event('input'));

    expect(input.value).toBe('5.100.000');
    expect(input.selectionStart).toBe(3);
  });
});
