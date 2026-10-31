import { Account } from '../../core/models/account';

/** Colombian 4x1000 tax, as the API charges it (SUP-10). Used only to preview the total. */
export const GMF_RATE = 0.004;

/** GMF of a debit, rounded half up to cents like the API; $0 for exempt accounts. */
export function gmfFor(account: Pick<Account, 'gmfExempt'>, amount: number): number {
  if (account.gmfExempt || !(amount > 0)) {
    return 0;
  }
  return Math.round(amount * GMF_RATE * 100 + Number.EPSILON) / 100;
}
