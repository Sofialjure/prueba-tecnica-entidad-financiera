import { TestBed } from '@angular/core/testing';
import { Avatar } from './avatar';

describe('Avatar', () => {
  async function render(firstName: string, lastName: string) {
    const fixture = TestBed.createComponent(Avatar);
    fixture.componentRef.setInput('firstName', firstName);
    fixture.componentRef.setInput('lastName', lastName);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('shows the initials of the first name and the last name', async () => {
    expect((await render('Ana María', 'Gómez')).textContent).toBe('AG');
    expect((await render(' laura ', 'restrepo')).textContent).toBe('LR');
  });

  it('always gives the same person the same color', async () => {
    const first = await render('Carlos Andrés', 'Pérez');
    const second = await render('Carlos Andrés', 'Pérez');

    expect(first.style.background).not.toBe('');
    expect(first.style.background).toBe(second.style.background);
  });
});
