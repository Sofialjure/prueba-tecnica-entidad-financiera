import {
  WITHDRAWAL_RECEIPT,
  DEPOSIT_RECEIPT,
} from '../../transactions/testing/transactions.fixtures';
import { statementCsv } from './statement-csv';

describe('statementCsv', () => {
  const lines = (csv: string) => csv.replace('\uFEFF', '').split('\r\n');

  it('writes a header and one row per movement for Excel in Spanish', () => {
    const csv = statementCsv([...WITHDRAWAL_RECEIPT.entries, ...DEPOSIT_RECEIPT.entries]);

    // Byte order mark, so Excel opens the accents correctly
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(lines(csv)).toEqual([
      'Fecha;Tipo;Descripción;Referencia;Débito;Crédito;Saldo',
      '2026-10-30 20:30:42;Retiro;Retiro;fadd403e-b5c8-4c0d-b02f-6432c045ef14;100000,00;;1699200,00',
      '2026-10-30 20:30:42;GMF 4x1000;GMF 4x1000;fadd403e-b5c8-4c0d-b02f-6432c045ef14;400,00;;1698800,00',
      '2026-10-30 20:30:42;Consignación;Nómina;f02d5846-0420-4ea9-a3ba-3f52fe4796c7;;50000,00;1849200,00',
    ]);
  });

  it('quotes descriptions with separators or quotes', () => {
    const [deposit] = DEPOSIT_RECEIPT.entries;

    const row = lines(statementCsv([{ ...deposit, description: 'Pago "arriendo"; octubre' }]))[1];

    expect(row).toContain(';"Pago ""arriendo""; octubre";');
  });
});
