# 4. API REST

- **URL base:** `http://localhost:8080/api/v1`
- **Documentación interactiva:** `http://localhost:8080/swagger-ui.html`
- **Formato:** JSON. Fechas en ISO-8601 y montos como números decimales.

## 4.1 Clientes

| Método | Endpoint | Descripción | RF |
|---|---|---|---|
| `POST` | `/clientes` | Crear cliente | RF-01, RF-05, RF-06 |
| `GET` | `/clientes` | Listar clientes | RF-02 |
| `GET` | `/clientes/{id}` | Consultar cliente | RF-02 |
| `PUT` | `/clientes/{id}` | Actualizar cliente | RF-03 |
| `DELETE` | `/clientes/{id}` | Eliminar cliente | RF-04 |
| `GET` | `/clientes/{id}/cuentas` | Cuentas del cliente | RF-19 |

**Ejemplo: crear cliente**

```http
POST /api/v1/clientes
Content-Type: application/json

{
  "tipoIdentificacion": "CC",
  "numeroIdentificacion": "1020304050",
  "nombres": "Ana María",
  "apellido": "Gómez",
  "correo": "ana.gomez@correo.com",
  "fechaNacimiento": "1995-04-12"
}
```

```http
201 Created
Location: /api/v1/clientes/1

{
  "id": 1,
  "tipoIdentificacion": "CC",
  "numeroIdentificacion": "1020304050",
  "nombres": "Ana María",
  "apellido": "Gómez",
  "correo": "ana.gomez@correo.com",
  "fechaNacimiento": "1995-04-12",
  "fechaCreacion": "2026-10-30T10:15:30",
  "fechaModificacion": "2026-10-30T10:15:30"
}
```

## 4.2 Cuentas

| Método | Endpoint | Descripción | RF |
|---|---|---|---|
| `POST` | `/cuentas` | Crear cuenta | RF-09 a RF-13 |
| `GET` | `/cuentas/{id}` | Consultar cuenta | RF-19 |
| `PATCH` | `/cuentas/{id}/activar` | Activar cuenta | RF-15 |
| `PATCH` | `/cuentas/{id}/inactivar` | Inactivar cuenta | RF-15 |
| `PATCH` | `/cuentas/{id}/cancelar` | Cancelar cuenta (saldo = 0) | RF-16 |
| `GET` | `/cuentas/{id}/movimientos` | Estado de cuenta | RF-24 |

**Ejemplo: crear cuenta**

```http
POST /api/v1/cuentas
Content-Type: application/json

{
  "clienteId": 1,
  "tipoCuenta": "AHORROS",
  "exentaGmf": false
}
```

```http
201 Created

{
  "id": 1,
  "tipoCuenta": "AHORROS",
  "numeroCuenta": "5300000001",
  "estado": "ACTIVA",
  "saldo": 0.00,
  "cupoSobregiro": 0.00,
  "saldoDisponible": 0.00,
  "exentaGmf": false,
  "clienteId": 1,
  "fechaCreacion": "2026-10-30T10:20:00",
  "fechaModificacion": "2026-10-30T10:20:00"
}
```

## 4.3 Transacciones

| Método | Endpoint | Descripción | RF |
|---|---|---|---|
| `POST` | `/transacciones/consignaciones` | Consignar en una cuenta | RF-20 |
| `POST` | `/transacciones/retiros` | Retirar de una cuenta | RF-21 |
| `POST` | `/transacciones/transferencias` | Transferir entre cuentas | RF-22 |

**Ejemplo: transferencia**

```http
POST /api/v1/transacciones/transferencias
Content-Type: application/json

{
  "cuentaOrigen": "5300000001",
  "cuentaDestino": "3300000001",
  "monto": 100000.00,
  "descripcion": "Pago arriendo"
}
```

```http
201 Created

{
  "referencia": "7f1c2b9e-4a7d-4f0e-9c1a-2f3b4c5d6e7f",
  "movimientos": [
    { "cuenta": "5300000001", "tipo": "TRANSFERENCIA", "naturaleza": "DEBITO",  "monto": 100000.00 },
    { "cuenta": "5300000001", "tipo": "GMF",           "naturaleza": "DEBITO",  "monto": 400.00 },
    { "cuenta": "3300000001", "tipo": "TRANSFERENCIA", "naturaleza": "CREDITO", "monto": 100000.00 }
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
  "instance": "/api/v1/transacciones/retiros"
}
```

| Código | Cuándo |
|---|---|
| `400` | Validación de formato (correo inválido, campos obligatorios, monto ≤ 0). |
| `404` | Cliente o cuenta inexistente. |
| `409` | Identificación duplicada o cliente con productos vinculados. |
| `422` | Menor de edad, saldo insuficiente, cuenta no activa, cancelación con saldo ≠ 0, reactivación de una cuenta cancelada. |
