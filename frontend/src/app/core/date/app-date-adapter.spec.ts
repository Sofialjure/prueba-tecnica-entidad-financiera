import { TestBed } from '@angular/core/testing';
import { DateAdapter, MAT_DATE_FORMATS, MatDateFormats } from '@angular/material/core';
import { provideAppDateAdapter } from './app-date-adapter';

describe('AppDateAdapter', () => {
  let adapter: DateAdapter<Date>;
  let formats: MatDateFormats;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideAppDateAdapter()] });
    adapter = TestBed.inject(DateAdapter);
    formats = TestBed.inject(MAT_DATE_FORMATS);
  });

  it('reads dates typed as day/month/year', () => {
    expect(adapter.parse('12/04/1995', formats.parse.dateInput)).toEqual(new Date(1995, 3, 12));
    expect(adapter.parse('1/2/1990', formats.parse.dateInput)).toEqual(new Date(1990, 1, 1));
  });

  it('marks impossible or badly written dates as invalid', () => {
    expect(adapter.isValid(adapter.parse('31/02/1995', formats.parse.dateInput)!)).toBe(false);
    expect(adapter.isValid(adapter.parse('1995-04-12', formats.parse.dateInput)!)).toBe(false);
  });

  it('treats an empty field as no date', () => {
    expect(adapter.parse('  ', formats.parse.dateInput)).toBeNull();
  });

  it('shows dates as dd/MM/yyyy in the field', () => {
    expect(adapter.format(new Date(1995, 3, 2), formats.display.dateInput)).toBe('02/04/1995');
  });

  it('names the calendar months in Spanish', () => {
    expect(adapter.getMonthNames('long')[3].toLowerCase()).toBe('abril');
  });
});
