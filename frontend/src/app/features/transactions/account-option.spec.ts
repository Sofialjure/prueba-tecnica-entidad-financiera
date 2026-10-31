import { Customer } from '../../core/models/customer';
import { CHECKING_ACCOUNT, SAVINGS_ACCOUNT } from '../accounts/testing/accounts.fixtures';
import { activeAccountOptions } from './account-option';

const person = (id: number, firstName: string, lastName: string) =>
  ({ id, firstName, lastName }) as Customer;

describe('activeAccountOptions', () => {
  it('offers only active accounts with their owner, sorted by owner and number', () => {
    const options = activeAccountOptions(
      [
        { ...SAVINGS_ACCOUNT, id: 1, customerId: 2, accountNumber: '5300000002' },
        { ...CHECKING_ACCOUNT, id: 2, customerId: 1, accountNumber: '3300000001' },
        { ...SAVINGS_ACCOUNT, id: 3, customerId: 1, accountNumber: '5300000001' },
        { ...SAVINGS_ACCOUNT, id: 4, customerId: 1, status: 'INACTIVE' },
      ],
      [person(1, 'Ana María', 'Gómez'), person(2, 'Carlos Andrés', 'Pérez')],
    );

    expect(options.map((o) => `${o.ownerName} ${o.account.accountNumber}`)).toEqual([
      'Ana María Gómez 3300000001',
      'Ana María Gómez 5300000001',
      'Carlos Andrés Pérez 5300000002',
    ]);
  });
});
