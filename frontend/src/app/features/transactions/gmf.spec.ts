import { gmfFor } from './gmf';

describe('gmfFor', () => {
  const taxed = { gmfExempt: false };

  it('charges 4 per 1,000 rounded half up to cents, like the API', () => {
    expect(gmfFor(taxed, 100000)).toBe(400);
    expect(gmfFor(taxed, 12345.67)).toBe(49.38);
    expect(gmfFor(taxed, 1.25)).toBe(0.01);
    expect(gmfFor(taxed, 1)).toBe(0);
  });

  it('charges nothing to exempt accounts or without a valid amount', () => {
    expect(gmfFor({ gmfExempt: true }, 100000)).toBe(0);
    expect(gmfFor(taxed, 0)).toBe(0);
    expect(gmfFor(taxed, NaN)).toBe(0);
  });
});
