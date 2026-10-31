import { Routes } from '@angular/router';

export const TRANSACTION_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./transactions-page/transactions-page').then((m) => m.TransactionsPage),
    title: 'Movimientos | Entidad Financiera',
  },
];
