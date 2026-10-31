import { BreakpointObserver } from '@angular/cdk/layout';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { greetingFor, Shell } from './shell';

describe('Shell', () => {
  function render(handset: boolean) {
    TestBed.configureTestingModule({
      imports: [Shell],
      providers: [
        provideRouter([]),
        { provide: BreakpointObserver, useValue: { observe: () => of({ matches: handset }) } },
      ],
    });
    const fixture = TestBed.createComponent(Shell);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('shows the brand and the side menu entries', () => {
    const element = render(false);
    const entries = Array.from(element.querySelectorAll('.nav-item'), (item) => item.textContent?.trim());

    expect(element.querySelector('.brand')?.textContent).toContain('Financiera');
    expect(entries).toEqual(['homeInicio', 'groupClientes', 'swap_horizMovimientos']);
  });

  it('keeps the menu open and hides the menu button on wide screens', () => {
    const element = render(false);

    expect(element.querySelector('button[aria-label="Abrir menú"]')).toBeNull();
  });

  it('shows the menu button on phones', () => {
    const element = render(true);

    expect(element.querySelector('button[aria-label="Abrir menú"]')).not.toBeNull();
  });
});

describe('greetingFor', () => {
  it('greets according to the time of day', () => {
    expect(greetingFor(8)).toBe('Buenos días');
    expect(greetingFor(12)).toBe('Buenas tardes');
    expect(greetingFor(18)).toBe('Buenas tardes');
    expect(greetingFor(19)).toBe('Buenas noches');
  });
});
