import { LabelPipe } from './label.pipe';

describe('LabelPipe', () => {
  const pipe = new LabelPipe();

  it('translates API values to Spanish', () => {
    expect(pipe.transform('SAVINGS', 'accountType')).toBe('Ahorros');
    expect(pipe.transform('CANCELLED', 'accountStatus')).toBe('Cancelada');
    expect(pipe.transform('WITHDRAWAL', 'transactionType')).toBe('Retiro');
    expect(pipe.transform('DEBIT', 'entryType')).toBe('Débito');
    expect(pipe.transform('CE', 'identificationType')).toBe('Cédula de extranjería');
  });

  it('shows unknown values as they come and empty values as blank', () => {
    expect(pipe.transform('CDT', 'accountType')).toBe('CDT');
    expect(pipe.transform(null, 'accountType')).toBe('');
    expect(pipe.transform(undefined, 'accountType')).toBe('');
  });
});
