import { BreakpointObserver } from '@angular/cdk/layout';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Shell } from './shell';

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

  it('shows the side menu entries', () => {
    const element = render(false);

    expect(element.querySelector('mat-nav-list')?.textContent).toContain('Inicio');
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
