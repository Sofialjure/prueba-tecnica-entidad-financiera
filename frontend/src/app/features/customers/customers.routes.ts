import { Routes } from '@angular/router';

export const CUSTOMER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./customer-list/customer-list').then((m) => m.CustomerList),
    title: 'Clientes | Entidad Financiera',
  },
];
