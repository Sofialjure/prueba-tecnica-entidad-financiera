import {
  AccountStatus,
  AccountType,
  EntryType,
  IdentificationType,
  TransactionType,
} from '../core/models/enums';

/** Spanish text shown for each API enum value; the code keeps the English values. */
export const LABELS = {
  identificationType: {
    CC: 'Cédula de ciudadanía',
    CE: 'Cédula de extranjería',
    PA: 'Pasaporte',
  } satisfies Record<IdentificationType, string>,
  accountType: {
    SAVINGS: 'Ahorros',
    CHECKING: 'Corriente',
  } satisfies Record<AccountType, string>,
  accountTypeName: {
    SAVINGS: 'Cuenta de ahorros',
    CHECKING: 'Cuenta corriente',
  } satisfies Record<AccountType, string>,
  accountStatus: {
    ACTIVE: 'Activa',
    INACTIVE: 'Inactiva',
    CANCELLED: 'Cancelada',
  } satisfies Record<AccountStatus, string>,
  transactionType: {
    DEPOSIT: 'Consignación',
    WITHDRAWAL: 'Retiro',
    TRANSFER: 'Transferencia',
    GMF: 'GMF 4x1000',
  } satisfies Record<TransactionType, string>,
  entryType: {
    CREDIT: 'Crédito',
    DEBIT: 'Débito',
  } satisfies Record<EntryType, string>,
};

export type LabelKind = keyof typeof LABELS;
