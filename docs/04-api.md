# 4. API REST

- **URL base:** `http://localhost:8080/api/v1`
- **Documentación interactiva:** `http://localhost:8080/swagger-ui.html`
- **Formato:** JSON. Fechas en ISO-8601 y montos como números decimales.
- **Idioma:** rutas y campos en inglés. Los mensajes de error (`title`, `detail`) van en español porque los leen los trabajadores de la entidad.

## 4.1 Clientes

| Método | Endpoint | Descripción | RF |
|---|---|---|---|
| `POST` | `/customers` | Crear cliente | RF-01, RF-05, RF-06 |
| `GET` | `/customers` | Listar clientes | RF-02 |
| `GET` | `/customers/{id}` | Consultar cliente | RF-02 |
| `PUT` | `/customers/{id}` | Actualizar cliente | RF-03 |
| `DELETE` | `/customers/{id}` | Eliminar cliente | RF-04 |
| `GET` | `/customers/{id}/accounts` | Cuentas del cliente | RF-19 |

**Ejemplo: crear cliente**

```http
POST /api/v1/customers
Content-Type: application/json

{
  "identificationType": "CC",
  "identificationNumber": "1020304050",
  "firstName": "Ana María",
  "lastName": "Gómez",
  "email": "ana.gomez@correo.com",
  "birthDate": "1995-04-12"
}
```

```http
201 Created
Location: /api/v1/customers/1

{
  "id": 1,
  "identificationType": "CC",
  "identificationNumber": "1020304050",
  "firstName": "Ana María",
  "lastName": "Gómez",
  "email": "ana.gomez@correo.com",
  "birthDate": "1995-04-12",
  "createdAt": "2026-10-30T10:15:30",
  "updatedAt": "2026-10-30T10:15:30"
}
```

## 4.2 Cuentas

| Método | Endpoint | Descripción | RF |
|---|---|---|---|
| `POST` | `/accounts` | Crear cuenta | RF-09 a RF-13 |
| `GET` | `/accounts/{id}` | Consultar cuenta | RF-19 |
| `PATCH` | `/accounts/{id}/activate` | Activar cuenta | RF-15 |
| `PATCH` | `/accounts/{id}/deactivate` | Inactivar cuenta | RF-15 |
| `PATCH` | `/accounts/{id}/cancel` | Cancelar cuenta (saldo = 0) | RF-16 |
| `GET` | `/accounts/{id}/transactions` | Estado de cuenta | RF-24 |

**Ejemplo: crear cuenta**

```http
POST /api/v1/accounts
Content-Type: application/json

{
  "customerId": 1,
  "accountType": "SAVINGS",
  "gmfExempt": false
}
```

```http
201 Created

{
  "id": 1,
  "accountType": "SAVINGS",
  "accountNumber": "5300000001",
  "status": "ACTIVE",
  "balance": 0.00,
  "overdraftLimit": 0.00,
  "availableBalance": 0.00,
  "gmfExempt": false,
  "customerId": 1,
  "createdAt": "2026-10-30T10:20:00",
  "updatedAt": "2026-10-30T10:20:00"
}
```

## 4.3 Transacciones

| Método | Endpoint | Descripción | RF |
|---|---|---|---|
| `POST` | `/transactions/deposits` | Consignar en una cuenta | RF-20 |
| `POST` | `/transactions/withdrawals` | Retirar de una cuenta | RF-21 |
| `POST` | `/transactions/transfers` | Transferir entre cuentas | RF-22 |

**Ejemplo: transferencia**

```http
POST /api/v1/transactions/transfers
Content-Type: application/json

{
  "sourceAccountNumber": "5300000001",
  "targetAccountNumber": "3300000001",
  "amount": 100000.00,
  "description": "Pago arriendo"
}
```

```http
201 Created

{
  "reference": "7f1c2b9e-4a7d-4f0e-9c1a-2f3b4c5d6e7f",
  "entries": [
    { "accountNumber": "5300000001", "type": "TRANSFER", "entryType": "DEBIT",  "amount": 100000.00 },
    { "accountNumber": "5300000001", "type": "GMF",      "entryType": "DEBIT",  "amount": 400.00 },
    { "accountNumber": "3300000001", "type": "TRANSFER", "entryType": "CREDIT", "amount": 100000.00 }
  ]
}
```

## 4.4 Errores

Todas las respuestas de error siguen el formato **RFC 7807 (Problem Details)**:

```http
422 Unprocessable Entity
Content-Type: application/problem+json

{
  "type": "about:blank",
  "title": "Regla de negocio violada",
  "status": 422,
  "detail": "Saldo disponible insuficiente en la cuenta 5300000001",
  "instance": "/api/v1/transactions/withdrawals"
}
```

| Código | Cuándo |
|---|---|
| `400` | Validación de formato (correo inválido, campos obligatorios, monto ≤ 0). |
| `404` | Cliente o cuenta inexistente. |
| `409` | Identificación duplicada o cliente con productos vinculados. |
| `422` | Menor de edad, saldo insuficiente, cuenta no activa, cancelación con saldo ≠ 0, reactivación de una cuenta cancelada. |
