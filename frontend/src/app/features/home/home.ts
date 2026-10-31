import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

interface Module {
  icon: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-home',
  imports: [MatCardModule, MatIconModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  protected readonly modules: Module[] = [
    {
      icon: 'group',
      title: 'Clientes',
      description: 'Registro, consulta, actualización y eliminación de clientes mayores de edad.',
    },
    {
      icon: 'account_balance_wallet',
      title: 'Cuentas',
      description: 'Cuentas de ahorros y corrientes: apertura, activación, inactivación y cancelación.',
    },
    {
      icon: 'swap_horiz',
      title: 'Transacciones',
      description: 'Consignaciones, retiros, transferencias y estado de cuenta, con el GMF (4x1000).',
    },
  ];
}
