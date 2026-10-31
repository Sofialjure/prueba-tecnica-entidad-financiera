import { AccountStatus, AccountType } from './enums';

/** Account as returned by GET /api/v1/accounts. Money comes as numbers with two decimals. */
export interface Account {
  id: number;
  accountType: AccountType;
  accountNumber: string;
  status: AccountStatus;
  balance: number;
  overdraftLimit: number;
  availableBalance: number;
  gmfExempt: boolean;
  customerId: number;
  createdAt: string;
  updatedAt: string;
}

/** Body of POST /api/v1/accounts; number, status and balance are set by the API. */
export interface OpenAccountRequest {
  customerId: number;
  accountType: AccountType;
  /** Only for checking accounts; savings accounts have no overdraft (SUP-01). */
  overdraftLimit: number;
  gmfExempt: boolean;
}
