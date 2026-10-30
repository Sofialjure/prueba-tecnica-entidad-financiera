# 0. Plan de trabajo

Fases del proyecto en el orden en que se desarrollan. Cada fase es una rama `feature/*` que se integra a `develop` con un Pull Request (ver [Git Flow](05-git-flow.md)). Este documento se actualiza en cada PR.

**Leyenda:** ✅ terminada · 🔄 en curso · ⏳ pendiente

## Resumen

| # | Fase | Rama | PR | Estado |
|---|---|---|---|---|
| 1 | Documentación técnica | `feature/documentacion` | [#1](https://github.com/Sofialjure/prueba-tecnica-entidad-financiera/pull/1) | ✅ |
| 2 | Base del backend | `feature/backend-base` | [#2](https://github.com/Sofialjure/prueba-tecnica-entidad-financiera/pull/2) | ✅ |
| 3 | Clientes | `feature/customers` | [#3](https://github.com/Sofialjure/prueba-tecnica-entidad-financiera/pull/3) | ✅ |
| 4 | Cuentas | `feature/accounts` | — | ⏳ |
| 5 | Transacciones | `feature/transactions` | — | ⏳ |
| 6 | Frontend | `feature/frontend` | — | ⏳ |
| 7 | Contenedores | `feature/docker` | — | ⏳ |
| 8 | Integración continua | `feature/ci` | — | ⏳ |
| 9 | Despliegue en la nube | `feature/cloud` | — | ⏳ |
| 10 | Versión 1.0.0 | `release/1.0.0` | — | ⏳ |

## Detalle por fase

### 1. Documentación técnica ✅

- [x] Requerimientos funcionales, no funcionales y supuestos de negocio
- [x] Arquitectura hexagonal, patrones de diseño, SOLID y ACID
- [x] Modelo de datos (diagrama entidad-relación)
- [x] Diseño de la API REST
- [x] Estrategia de ramas y convención de commits
- [x] Decisiones de arquitectura (ADR 0001 a 0005)

### 2. Base del backend ✅

- [x] Proyecto Spring Boot 4.1 / Java 21 con estructura hexagonal
- [x] DDL: tablas, secuencias y restricciones (`V1__create_schema.sql`)
- [x] DML: datos de ejemplo (`V2__seed_data.sql`)
- [x] Manejo global de errores (RFC 7807)
- [x] Swagger UI y PostgreSQL local con Docker Compose
- [x] Tests de migraciones y de manejo de errores

### 3. Clientes ✅

- [x] Modelo de dominio `Customer` con sus reglas: mayoría de edad, correo, nombres (RF-05, RF-07, RF-08)
- [x] Crear, consultar, listar y actualizar clientes con fechas automáticas (RF-01, RF-02, RF-03, RF-06)
- [x] Eliminar cliente solo si no tiene cuentas (RF-04)
- [x] Identificación única (SUP-07)
- [x] Entidad JPA, repositorio y adaptador de persistencia
- [x] Controller REST con validaciones
- [x] Tests unitarios de Service y Controller (cobertura 100 % en ambas capas)

### 4. Cuentas ⏳

- [ ] Modelo de dominio `Account` con reglas por tipo (ahorros / corriente)
- [ ] Crear cuenta con número automático de 10 dígitos: 53 ahorros, 33 corriente (RF-09 a RF-13)
- [ ] Activar, inactivar y cancelar con saldo $0 (RF-15, RF-16)
- [ ] Consultar una cuenta y las cuentas de un cliente (RF-19)
- [ ] Tests unitarios de Service y Controller

### 5. Transacciones ⏳

- [ ] Consignación, retiro y transferencia (RF-20, RF-21, RF-22)
- [ ] Actualización de saldo y saldo disponible (RF-18, RF-23)
- [ ] GMF 4×1000 en cuentas no exentas (SUP-10)
- [ ] Bloqueo de cuentas para operaciones simultáneas (RNF-10)
- [ ] Estado de cuenta (RF-24)
- [ ] Tests unitarios de Service y Controller, y prueba de concurrencia

### 6. Frontend ⏳

- [ ] Proyecto Angular con Angular Material
- [ ] Componentes reutilizables (tabla, formulario, diálogo de confirmación)
- [ ] Pantallas de clientes, cuentas y transacciones
- [ ] Estado de cuenta
- [ ] Mensajes de error de la API visibles para el usuario

### 7. Contenedores ⏳

- [ ] Dockerfile multi-stage del backend
- [ ] Dockerfile multi-stage del frontend (Nginx)
- [ ] Docker Compose con los 3 contenedores: `docker compose up --build`

### 8. Integración continua ⏳

- [ ] GitHub Actions: compilar y ejecutar tests del backend y del frontend en cada PR
- [ ] Reporte de cobertura (JaCoCo)

### 9. Despliegue en la nube ⏳

- [ ] Elegir proveedor
- [ ] Desplegar base de datos, backend y frontend
- [ ] Documentar los servicios usados ([Despliegue](06-despliegue.md))

### 10. Versión 1.0.0 ⏳

- [ ] Rama `release/1.0.0`, revisión final de la documentación
- [ ] Integración a `main` con el tag `v1.0.0`
