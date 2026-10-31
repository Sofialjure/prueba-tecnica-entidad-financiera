import { TestBed } from '@angular/core/testing';
import { EmptyState } from './empty-state';

describe('EmptyState', () => {
  it('shows the icon and the message', async () => {
    const fixture = TestBed.createComponent(EmptyState);
    fixture.componentRef.setInput('icon', 'group');
    fixture.componentRef.setInput('message', 'No hay clientes registrados');
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('mat-icon')?.textContent).toBe('group');
    expect(element.querySelector('p')?.textContent).toBe('No hay clientes registrados');
  });
});
