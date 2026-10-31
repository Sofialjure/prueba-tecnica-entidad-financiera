import { TransactionReceipt } from '../../../core/models/transaction';

/** A withdrawal of $100.000 from a non-exempt savings account, as the API answers it. */
export const WITHDRAWAL_RECEIPT: TransactionReceipt = {
  reference: 'fadd403e-b5c8-4c0d-b02f-6432c045ef14',
  entries: [
    {
      id: 10,
      reference: 'fadd403e-b5c8-4c0d-b02f-6432c045ef14',
      accountNumber: '5300000001',
      type: 'WITHDRAWAL',
      entryType: 'DEBIT',
      amount: 100000,
      balanceAfter: 1699200,
      description: 'Retiro',
      createdAt: '2026-10-30T20:30:42',
    },
    {
      id: 11,
      reference: 'fadd403e-b5c8-4c0d-b02f-6432c045ef14',
      accountNumber: '5300000001',
      type: 'GMF',
      entryType: 'DEBIT',
      amount: 400,
      balanceAfter: 1698800,
      description: 'GMF 4x1000',
      createdAt: '2026-10-30T20:30:42',
    },
  ],
};

export const DEPOSIT_RECEIPT: TransactionReceipt = {
  reference: 'f02d5846-0420-4ea9-a3ba-3f52fe4796c7',
  entries: [
    {
      id: 9,
      reference: 'f02d5846-0420-4ea9-a3ba-3f52fe4796c7',
      accountNumber: '5300000001',
      type: 'DEPOSIT',
      entryType: 'CREDIT',
      amount: 50000,
      balanceAfter: 1849200,
      description: 'Nómina',
      createdAt: '2026-10-30T20:30:42',
    },
  ],
};
