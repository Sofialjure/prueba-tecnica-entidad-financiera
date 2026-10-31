import { TestBed } from '@angular/core/testing';
import { AccountStatus } from '../../../core/models/enums';
import { StatusChip } from './status-chip';

describe('StatusChip', () => {
  async function render(status: AccountStatus) {
    const fixture = TestBed.createComponent(StatusChip);
    fixture.componentRef.setInput('status', status);
    await fixture.whenStable();
    return (fixture.nativeElement as HTMLElement).querySelector('span')!;
  }

  it.each([
    ['ACTIVE', 'Activa', 'active'],
    ['INACTIVE', 'Inactiva', 'inactive'],
    ['CANCELLED', 'Cancelada', 'cancelled'],
  ] as const)('shows %s as "%s" with its color', async (status, text, cssClass) => {
    const chip = await render(status);

    expect(chip.textContent).toBe(text);
    expect(chip.classList).toContain('chip');
    expect(chip.classList).toContain(cssClass);
  });
});
