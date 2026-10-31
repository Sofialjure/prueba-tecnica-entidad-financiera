import { previewDebit } from './overdraft';

describe('previewDebit', () => {
  it('uses no overdraft while the balance covers the debit', () => {
    expect(previewDebit({ balance: 1000 }, 400)).toEqual({ balanceAfter: 600, overdraftUsed: 0 });
  });

  it('counts only the part of the debit beyond the balance', () => {
    expect(previewDebit({ balance: 1000 }, 1500.5)).toEqual({
      balanceAfter: -500.5,
      overdraftUsed: 500.5,
    });
  });

  it('adds to an overdraft already in use', () => {
    expect(previewDebit({ balance: -250000 }, 100000)).toEqual({
      balanceAfter: -350000,
      overdraftUsed: 100000,
    });
  });
});
