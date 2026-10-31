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

/** Body of POST /transactions/deposits and /transactions/withdrawals. */
export interface MovementRequest {
  accountNumber: string;
  amount: number;
  description?: string;
}
