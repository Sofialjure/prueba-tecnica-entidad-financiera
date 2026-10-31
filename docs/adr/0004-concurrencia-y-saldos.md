# ADR-0004: Bloqueo pesimista y saldo disponible como columna generada

**Estado:** Aceptada

## Contexto

Dos operaciones simultáneas sobre la misma cuenta (por ejemplo, dos retiros) podrían leer el mismo saldo y dejarlo inconsistente (*lost update*). Además, el enunciado distingue entre **saldo** y **saldo disponible**, y ambos deben actualizarse con cada transacción.

## Decisión

1. **Bloqueo pesimista** (`@Lock(PESSIMISTIC_WRITE)`, que genera `SELECT ... FOR UPDATE`) al leer las cuentas que se van a modificar, dentro de un `@Transactional`.
2. En las transferencias, las dos cuentas se bloquean **en orden ascendente de id**, sin importar cuál es el origen y cuál el destino. Así se evitan *deadlocks*. Se hace con una sola consulta `... WHERE account_number IN (...) ORDER BY id FOR UPDATE`: PostgreSQL bloquea las filas en el orden en que las devuelve.
3. `available_balance` es una **columna generada** en PostgreSQL: `GENERATED ALWAYS AS (balance + overdraft_limit) STORED`. Se persiste y se actualiza automáticamente cada vez que cambia el saldo.
4. Activar, inactivar y cancelar también bloquean la cuenta. Sin ese bloqueo, una cancelación podría validar saldo $0, una consignación simultánea confirmarse en medio, y la cancelación guardar después el saldo viejo, perdiendo el dinero consignado.

## Alternativas consideradas

- **Bloqueo optimista** (`@Version`): ante un conflicto obliga a reintentar. En operaciones monetarias con alta contención se prefiere serializar el acceso a la cuenta.
- **Calcular el saldo disponible solo en la aplicación**: no quedaría persistido ni sería consultable desde SQL.
- **Columna normal actualizada por la aplicación**: puede quedar inconsistente si algún flujo olvida actualizarla.

## Consecuencias

- ✅ No hay pérdida de actualizaciones ni saldos negativos indebidos bajo concurrencia. Lo comprueba `TransactionConcurrencyTest` contra PostgreSQL real: 10 retiros simultáneos sobre la misma cuenta y 20 transferencias cruzadas entre dos cuentas.
- ✅ El saldo disponible siempre es coherente con el saldo y el cupo.
- ⚠️ Las operaciones sobre una misma cuenta se serializan, lo cual es aceptable porque las transacciones son cortas.
