import { Account } from '../../core/models/account';

export interface DebitPreview {
  /** Balance once the debit (amount plus GMF) is applied; negative when using the overdraft. */
  balanceAfter: number;
  /** Part of this debit paid with the overdraft line (SUP-01); 0 when the balance covers it. */
  overdraftUsed: number;
}

/** What a debit does to a checking account's overdraft, to show it before confirming. */
export function previewDebit(account: Pick<Account, 'balance'>, totalDebit: number): DebitPreview {
  const balanceAfter = round(account.balance - totalDebit);
  const owedBefore = Math.max(0, -account.balance);
  const owedAfter = Math.max(0, -balanceAfter);
  return { balanceAfter, overdraftUsed: round(owedAfter - owedBefore) };
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
