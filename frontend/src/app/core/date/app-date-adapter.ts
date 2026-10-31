import { Injectable, Provider } from '@angular/core';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
  MatDateFormats,
  NativeDateAdapter,
} from '@angular/material/core';

/** Format the user types and sees in date fields. */
const INPUT_FORMAT = 'dd/MM/yyyy';
const DAY_MONTH_YEAR = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;

/**
 * Native adapter that reads and writes dates as dd/MM/yyyy, the Colombian format. The default one
 * relies on Date.parse, which reads 12/04/1995 as December 4th.
 */
@Injectable()
export class AppDateAdapter extends NativeDateAdapter {
  override parse(value: unknown, parseFormat: object): Date | null {
    if (typeof value !== 'string') {
      return super.parse(value, parseFormat);
    }
    if (!value.trim()) {
      return null;
    }
    const match = value.trim().match(DAY_MONTH_YEAR);
    if (!match) {
      return this.invalid();
    }
    const [day, month, year] = [Number(match[1]), Number(match[2]), Number(match[3])];
    const date = new Date(year, month - 1, day);
    // Rejects impossible dates such as 31/02/1995, which Date would roll over to March
    return date.getMonth() === month - 1 && date.getDate() === day ? date : this.invalid();
  }

  override format(date: Date, displayFormat: object): string {
    if ((displayFormat as unknown) !== INPUT_FORMAT) {
      return super.format(date, displayFormat);
    }
    const pad = (value: number) => value.toString().padStart(2, '0');
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
  }
}

const APP_DATE_FORMATS: MatDateFormats = {
  parse: { dateInput: INPUT_FORMAT },
  display: {
    dateInput: INPUT_FORMAT,
    monthYearLabel: { year: 'numeric', month: 'short' },
    dateA11yLabel: { year: 'numeric', month: 'long', day: 'numeric' },
    monthYearA11yLabel: { year: 'numeric', month: 'long' },
  },
};

/** Spanish calendar (month names, weeks starting on Monday) with dd/MM/yyyy dates. */
export function provideAppDateAdapter(): Provider[] {
  return [
    { provide: DateAdapter, useClass: AppDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: APP_DATE_FORMATS },
    { provide: MAT_DATE_LOCALE, useValue: 'es-CO' },
  ];
}
