import { Account } from '../../core/models/account';
import { Customer } from '../../core/models/customer';

/** An account with its owner's name, as offered in the account pickers. */
export interface AccountOption {
  account: Account;
  ownerName: string;
}

/** Only active accounts can move money (SUP-05); sorted by owner and number. */
export function activeAccountOptions(accounts: Account[], customers: Customer[]): AccountOption[] {
  const names = new Map(customers.map((c) => [c.id, `${c.firstName} ${c.lastName}`]));
  return accounts
    .filter((account) => account.status === 'ACTIVE')
    .map((account) => ({ account, ownerName: names.get(account.customerId) ?? '' }))
    .sort(
      (a, b) =>
        a.ownerName.localeCompare(b.ownerName, 'es') ||
        a.account.accountNumber.localeCompare(b.account.accountNumber),
    );
}
