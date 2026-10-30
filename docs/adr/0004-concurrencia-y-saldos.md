# ADR-0004: Bloqueo pesimista y saldo disponible como columna generada

**Estado:** Aceptada

## Contexto

Dos operaciones simultáneas sobre la misma cuenta (por ejemplo, dos retiros) podrían leer el mismo saldo y dejarlo inconsistente (*lost update*). Además, el enunciado distingue entre **saldo** y **saldo disponible**, y ambos deben actualizarse con cada transacción.

## Decisión

1. **Bloqueo pesimista** (`@Lock(PESSIMISTIC_WRITE)`, que genera `SELECT ... FOR UPDATE`) al leer las cuentas que se van a modificar, dentro de un `@Transactional`.
2. En las transferencias, las dos cuentas se bloquean **en orden ascendente de id**, sin importar cuál es el origen y cuál el destino. Así se evitan *deadlocks*.
3. `saldo_disponible` es una **columna generada** en PostgreSQL: `GENERATED ALWAYS AS (saldo + cupo_sobregiro) STORED`. Se persiste y se actualiza automáticamente cada vez que cambia el saldo.

## Alternativas consideradas

- **Bloqueo optimista** (`@Version`): ante un conflicto obliga a reintentar. En operaciones monetarias con alta contención se prefiere serializar el acceso a la cuenta.
- **Calcular el saldo disponible solo en la aplicación**: no quedaría persistido ni sería consultable desde SQL.
- **Columna normal actualizada por la aplicación**: puede quedar inconsistente si algún flujo olvida actualizarla.

## Consecuencias

- ✅ No hay pérdida de actualizaciones ni saldos negativos indebidos bajo concurrencia.
- ✅ El saldo disponible siempre es coherente con el saldo y el cupo.
- ⚠️ Las operaciones sobre una misma cuenta se serializan, lo cual es aceptable porque las transacciones son cortas.
