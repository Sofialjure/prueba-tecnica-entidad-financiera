import { Account } from '../../../core/models/account';

/** Accounts shaped like the API seed data, for tests. */
export const SAVINGS_ACCOUNT: Account = {
  id: 1,
  accountType: 'SAVINGS',
  accountNumber: '5300000001',
  status: 'ACTIVE',
  balance: 1799200,
  overdraftLimit: 0,
  availableBalance: 1799200,
  gmfExempt: false,
  customerId: 1,
  createdAt: '2026-10-01T08:05:00',
  updatedAt: '2026-10-05T10:00:00',
};

export const CHECKING_ACCOUNT: Account = {
  ...SAVINGS_ACCOUNT,
  id: 2,
  accountType: 'CHECKING',
  accountNumber: '3300000001',
  balance: -250000,
  overdraftLimit: 500000,
  availableBalance: 250000,
  gmfExempt: true,
};
