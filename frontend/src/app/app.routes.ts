import { Routes } from '@angular/router';
import { Home } from './features/home/home';

/** Each feature is loaded on demand, so the initial bundle stays small. */
export const routes: Routes = [
  { path: '', component: Home, title: 'Inicio | Entidad Financiera' },
  {
    path: 'customers',
    loadChildren: () =>
      import('./features/customers/customers.routes').then((m) => m.CUSTOMER_ROUTES),
  },
  {
    path: 'accounts',
    loadChildren: () => import('./features/accounts/accounts.routes').then((m) => m.ACCOUNT_ROUTES),
  },
  {
    path: 'transactions',
    loadChildren: () =>
      import('./features/transactions/transactions.routes').then((m) => m.TRANSACTION_ROUTES),
  },
  { path: '**', redirectTo: '' },
];
