import { AccountNumberPipe } from './account-number.pipe';

describe('AccountNumberPipe', () => {
  const pipe = new AccountNumberPipe();

  it('groups the ten digits as prefix and two blocks', () => {
    expect(pipe.transform('5300000003')).toBe('53 0000 0003');
    expect(pipe.transform('3312345678')).toBe('33 1234 5678');
  });

  it('leaves anything else as it comes', () => {
    expect(pipe.transform('123')).toBe('123');
    expect(pipe.transform(null)).toBe('');
  });
});
