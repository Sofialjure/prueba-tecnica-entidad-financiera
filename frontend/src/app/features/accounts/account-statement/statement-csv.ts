import { Transaction } from '../../../core/models/transaction';
import { LABELS } from '../../../shared/labels';

/**
 * Statement as CSV for Excel in Spanish: semicolon separator, decimal comma and a BOM so
 * accents open correctly.
 */
export function statementCsv(transactions: Transaction[]): string {
  const header = ['Fecha', 'Tipo', 'Descripción', 'Referencia', 'Débito', 'Crédito', 'Saldo'];
  const rows = transactions.map((t) => [
    t.createdAt.replace('T', ' '),
    LABELS.transactionType[t.type],
    t.description ?? '',
    t.reference,
    t.entryType === 'DEBIT' ? decimal(t.amount) : '',
    t.entryType === 'CREDIT' ? decimal(t.amount) : '',
    decimal(t.balanceAfter),
  ]);
  return '\uFEFF' + [header, ...rows].map((row) => row.map(cell).join(';')).join('\r\n');
}

function decimal(value: number): string {
  return value.toFixed(2).replace('.', ',');
}

/** Quotes a cell when it contains the separator, quotes or line breaks. */
function cell(value: string): string {
  return /[;"\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}
