import { fromIsoDate, toIsoDate } from './dates';

describe('dates', () => {
  it('converts a date to the API format', () => {
    expect(toIsoDate(new Date(1995, 3, 2))).toBe('1995-04-02');
  });

  it('reads an API date at local midnight', () => {
    expect(fromIsoDate('1995-04-12')).toEqual(new Date(1995, 3, 12));
  });
});
