import { registerLocaleData } from '@angular/common';
import localeEsCo from '@angular/common/locales/es-CO';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, Subject } from 'rxjs';
import { DashboardService, DashboardSummary } from './dashboard.service';
import { Home } from './home';

registerLocaleData(localeEsCo);

const SUMMARY: DashboardSummary = {
  customers: 3,
  activeAccounts: 3,
  totalAccounts: 4,
  totalBalance: 3298800,
  recentCustomers: [
    {
      id: 3,
      identificationType: 'CE',
      identificationNumber: '456789',
      firstName: 'Laura',
      lastName: 'Restrepo',
      email: 'laura.restrepo@correo.com',
      birthDate: '1990-01-15',
      createdAt: '2026-10-01T09:00:00',
      updatedAt: '2026-10-01T09:00:00',
    },
  ],
};

describe('Home', () => {
  async function render(summary$ = of(SUMMARY)) {
    TestBed.configureTestingModule({
      imports: [Home],
      providers: [
        provideRouter([]),
        { provide: DashboardService, useValue: { summary: () => summary$ } },
        { provide: LOCALE_ID, useValue: 'es-CO' },
      ],
    });
    const fixture = TestBed.createComponent(Home);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('shows the indicators of the entity', async () => {
    const values = Array.from((await render()).querySelectorAll('.stat-value'), (value) =>
      value.textContent?.replace(/\s+/g, ' ').trim(),
    );

    expect(values).toEqual(['3', '3 de 4', '$ 3.298.800']);
  });

  it('lists the most recent customers', async () => {
    const element = await render();

    expect(element.querySelector('.people')?.textContent).toContain('Laura Restrepo');
    expect(element.querySelector('.people')?.textContent).toContain('CE 456789');
  });

  it('offers quick links to the customer screens', async () => {
    const links = Array.from((await render()).querySelectorAll('.action'), (link) =>
      link.getAttribute('href'),
    );

    expect(links).toEqual(['/customers/new', '/customers']);
  });

  it('shows dashes and a progress bar while loading', async () => {
    const element = await render(new Subject<DashboardSummary>());

    expect(element.querySelector('mat-progress-bar')).not.toBeNull();
    expect(element.querySelector('.stat-value')?.textContent?.trim()).toBe('—');
  });
});
