import { Routes } from '@angular/router';

export const ACCOUNT_ROUTES: Routes = [
  {
    path: ':id/statement',
    loadComponent: () =>
      import('./account-statement/account-statement').then((m) => m.AccountStatement),
    title: 'Estado de cuenta | Entidad Financiera',
  },
];
