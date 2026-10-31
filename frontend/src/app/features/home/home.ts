import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { Avatar } from '../../shared/components/avatar/avatar';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { DashboardService, DashboardSummary } from './dashboard.service';

interface QuickAction {
  icon: string;
  title: string;
  description: string;
  route: string;
}

@Component({
  selector: 'app-home',
  imports: [
    Avatar,
    CurrencyPipe,
    DatePipe,
    EmptyState,
    MatIconModule,
    MatProgressBarModule,
    PageHeader,
    RouterLink,
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  private readonly dashboardService = inject(DashboardService);

  protected readonly summary = signal<DashboardSummary | null>(null);
  protected readonly loading = signal(true);

  protected readonly quickActions: QuickAction[] = [
    {
      icon: 'person_add',
      title: 'Registrar cliente',
      description: 'Crear un cliente nuevo',
      route: '/customers/new',
    },
    {
      icon: 'group',
      title: 'Consultar clientes',
      description: 'Buscar, editar o eliminar',
      route: '/customers',
    },
  ];

  ngOnInit(): void {
    this.dashboardService
      .summary()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({ next: (summary) => this.summary.set(summary), error: () => undefined });
  }
}
