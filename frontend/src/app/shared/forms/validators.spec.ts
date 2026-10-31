import { FormControl } from '@angular/forms';
import { latestAdultBirthDate, legalAge, trimmedMinLength } from './validators';

describe('trimmedMinLength', () => {
  const validator = trimmedMinLength(2);

  it('ignores surrounding spaces, like the API does', () => {
    expect(validator(new FormControl(' A '))).toEqual({ trimmedMinLength: { requiredLength: 2 } });
    expect(validator(new FormControl(' Al '))).toBeNull();
  });

  it('leaves empty values to the required validator', () => {
    expect(validator(new FormControl(''))).toBeNull();
    expect(validator(new FormControl(null))).toBeNull();
  });
});

describe('legalAge', () => {
  /** 30 Oct 2026, 3 p.m. local time. */
  const validator = legalAge(18, () => new Date(2026, 9, 30, 15, 0));

  it('accepts someone who turns 18 today', () => {
    expect(validator(new FormControl(new Date(2008, 9, 30)))).toBeNull();
  });

  it('rejects someone who turns 18 tomorrow', () => {
    expect(validator(new FormControl(new Date(2008, 9, 31)))).toEqual({ legalAge: { years: 18 } });
  });

  it('leaves empty or unreadable dates to the other validators', () => {
    expect(validator(new FormControl(null))).toBeNull();
    expect(validator(new FormControl(new Date(NaN)))).toBeNull();
  });
});

describe('latestAdultBirthDate', () => {
  it('returns the same day 18 years ago', () => {
    expect(latestAdultBirthDate(18, new Date(2026, 0, 5, 15, 0))).toEqual(new Date(2008, 0, 5));
  });
});
