import { Routes } from '@angular/router';

const loadForm = () => import('./customer-form/customer-form').then((m) => m.CustomerForm);

export const CUSTOMER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./customer-list/customer-list').then((m) => m.CustomerList),
    title: 'Clientes | Entidad Financiera',
  },
  { path: 'new', loadComponent: loadForm, title: 'Nuevo cliente | Entidad Financiera' },
  {
    path: ':id',
    loadComponent: () => import('./customer-detail/customer-detail').then((m) => m.CustomerDetail),
    title: 'Cliente | Entidad Financiera',
  },
  { path: ':id/edit', loadComponent: loadForm, title: 'Editar cliente | Entidad Financiera' },
];
