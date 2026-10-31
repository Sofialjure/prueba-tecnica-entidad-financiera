export interface NavItem {
  label: string;
  icon: string;
  route: string;
}

/** Side menu entries. Each feature adds its own entry when it is built. */
export const NAV_ITEMS: NavItem[] = [
  { label: 'Inicio', icon: 'home', route: '/' },
  { label: 'Clientes', icon: 'group', route: '/customers' },
  { label: 'Movimientos', icon: 'swap_horiz', route: '/transactions' },
];
