import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Same rule as the API, which strips spaces before checking the length (RF-08). */
export function trimmedMinLength(min: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = (control.value ?? '').toString().trim();
    return value.length > 0 && value.length < min ? { trimmedMinLength: { requiredLength: min } } : null;
  };
}

/** Rejects birth dates of people younger than `years` (RF-05). */
export function legalAge(years: number, today: () => Date = () => new Date()): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const birthDate = control.value as Date | null;
    if (!(birthDate instanceof Date) || isNaN(birthDate.getTime())) {
      return null;
    }
    return birthDate > latestAdultBirthDate(years, today()) ? { legalAge: { years } } : null;
  };
}

/** Latest birth date of someone who is already `years` old today. */
export function latestAdultBirthDate(years: number, today: Date = new Date()): Date {
  return new Date(today.getFullYear() - years, today.getMonth(), today.getDate());
}
