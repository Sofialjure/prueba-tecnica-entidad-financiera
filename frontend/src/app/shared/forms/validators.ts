import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Same rule as the API, which strips spaces before checking the length (RF-08). */
export function trimmedMinLength(min: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = (control.value ?? '').toString().trim();
    return value.length > 0 && value.length < min ? { trimmedMinLength: { requiredLength: min } } : null;
  };
}

/** Rejects birth dates of people younger than `years` (RF-05). The value is a yyyy-MM-dd string. */
export function legalAge(years: number, today: () => Date = () => new Date()): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }
    const [year, month, day] = (control.value as string).split('-').map(Number);
    const adulthood = new Date(year + years, month - 1, day);
    const now = today();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return adulthood > startOfToday ? { legalAge: { years } } : null;
  };
}

/** Latest birth date allowed for an adult, as yyyy-MM-dd, for the date input's `max` attribute. */
export function latestAdultBirthDate(years: number, today: Date = new Date()): string {
  const date = new Date(today.getFullYear() - years, today.getMonth(), today.getDate());
  const pad = (value: number) => value.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
