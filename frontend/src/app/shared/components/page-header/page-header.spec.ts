import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PageHeader } from './page-header';

@Component({
  imports: [PageHeader],
  template: `
    <app-page-header title="Clientes" subtitle="3 registrados">
      <button>Nuevo cliente</button>
    </app-page-header>
  `,
})
class Host {}

describe('PageHeader', () => {
  it('shows the title, the subtitle and the projected actions', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('h1')?.textContent).toBe('Clientes');
    expect(element.querySelector('.subtitle')?.textContent).toBe('3 registrados');
    expect(element.querySelector('.actions button')?.textContent).toBe('Nuevo cliente');
  });

  it('omits the subtitle when there is none', async () => {
    const fixture = TestBed.createComponent(PageHeader);
    fixture.componentRef.setInput('title', 'Cuentas');
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).querySelector('.subtitle')).toBeNull();
  });
});
