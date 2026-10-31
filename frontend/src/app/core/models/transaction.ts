import { Account } from './account';
import { EntryType, TransactionType } from './enums';

/** One movement on one account; movements are never edited nor deleted (SUP-13). */
export interface Transaction {
  id: number;
  reference: string;
  accountNumber: string;
  type: TransactionType;
  entryType: EntryType;
  amount: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
}

/** Answer of every operation: the movements it generated, grouped by one reference. */
export interface TransactionReceipt {
  reference: string;
  entries: Transaction[];
}

/** GET /accounts/{id}/transactions: the account and its movements, newest first (RF-24). */
export interface AccountStatement {
  account: Account;
  transactions: Transaction[];
}

/** Body of POST /transactions/transfers. */
export interface TransferRequest {
  sourceAccountNumber: string;
  targetAccountNumber: string;
  amount: number;
  description?: string;
}

/** Body of POST /transactions/deposits and /transactions/withdrawals. */
export interface MovementRequest {
  accountNumber: string;
  amount: number;
  description?: string;
}
