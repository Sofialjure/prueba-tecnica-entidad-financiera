import { TestBed } from '@angular/core/testing';
import { Home } from './home';

describe('Home', () => {
  it('describes the three modules of the application', async () => {
    const fixture = TestBed.createComponent(Home);
    await fixture.whenStable();

    const titles = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('mat-card-title'),
      (title) => title.textContent?.trim(),
    );
    expect(titles).toEqual(['Clientes', 'Cuentas', 'Transacciones']);
  });
});
