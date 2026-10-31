import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { map } from 'rxjs';
import { NAV_ITEMS } from './nav-items';

/** Application frame: navy side menu and a top bar; the menu becomes a drawer on phones. */
@Component({
  selector: 'app-shell',
  imports: [
    DatePipe,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
  ],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  protected readonly navItems = NAV_ITEMS;
  protected readonly today = new Date();
  protected readonly greeting = greetingFor(this.today.getHours());

  private readonly handset = toSignal(
    inject(BreakpointObserver)
      .observe(Breakpoints.Handset)
      .pipe(map((state) => state.matches)),
    { initialValue: false },
  );
  protected readonly sidenavMode = computed(() => (this.handset() ? 'over' : 'side'));
  protected readonly sidenavOpened = computed(() => !this.handset());
}

export function greetingFor(hour: number): string {
  if (hour < 12) {
    return 'Buenos días';
  }
  return hour < 19 ? 'Buenas tardes' : 'Buenas noches';
}
