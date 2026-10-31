# 0. Plan de trabajo

Fases del proyecto en el orden en que se desarrollan. Cada fase se divide en PRs pequeños: cada uno es una rama `feature/*` que se integra a `develop` (ver [Git Flow](05-git-flow.md)). Este documento se actualiza en cada PR.

**Leyenda:** ✅ terminada · 🔄 en curso · ⏳ pendiente

## Resumen

| # | Fase | Rama | PR | Estado |
|---|---|---|---|---|
| 1 | Documentación técnica | `feature/documentacion` | [#1](https://github.com/Sofialjure/prueba-tecnica-entidad-financiera/pull/1) | ✅ |
| 2 | Base del backend | `feature/backend-base` | [#2](https://github.com/Sofialjure/prueba-tecnica-entidad-financiera/pull/2) | ✅ |
| 3 | Clientes | `feature/customers` | [#3](https://github.com/Sofialjure/prueba-tecnica-entidad-financiera/pull/3) | ✅ |
| 4 | Cuentas | `feature/accounts` | [#4](https://github.com/Sofialjure/prueba-tecnica-entidad-financiera/pull/4) | ✅ |
| 4.1 | Cuentas: cerrar el cupo de sobregiro al cancelar | `feature/close-overdraft-on-cancel` | [#16](https://github.com/Sofialjure/prueba-tecnica-entidad-financiera/pull/16) | ✅ |
| 5 | Transacciones | `feature/transactions` | [#5](https://github.com/Sofialjure/prueba-tecnica-entidad-financiera/pull/5) | ✅ |
| 6.1 | Frontend: proyecto base y layout | `feature/frontend-setup` | [#6](https://github.com/Sofialjure/prueba-tecnica-entidad-financiera/pull/6) | ✅ |
| 6.2 | Frontend: componentes compartidos | `feature/frontend-shared-components` | [#7](https://github.com/Sofialjure/prueba-tecnica-entidad-financiera/pull/7) | ✅ |
| 6.3 | Frontend: listado y eliminación de clientes | `feature/frontend-customers-list` | [#8](https://github.com/Sofialjure/prueba-tecnica-entidad-financiera/pull/8) | ✅ |
| 6.4 | Frontend: formulario de cliente | `feature/frontend-customer-form` | [#9](https://github.com/Sofialjure/prueba-tecnica-entidad-financiera/pull/9) | ✅ |
| 6.5 | Frontend: rediseño visual (estilo banca moderna) | `feature/frontend-visual-redesign` | [#10](https://github.com/Sofialjure/prueba-tecnica-entidad-financiera/pull/10) | ✅ |
| 6.6 | Frontend: cuentas del cliente y apertura | `feature/frontend-accounts` | [#11](https://github.com/Sofialjure/prueba-tecnica-entidad-financiera/pull/11) | ✅ |
| 6.7 | Frontend: activar, inactivar y cancelar cuentas | `feature/frontend-account-status` | [#12](https://github.com/Sofialjure/prueba-tecnica-entidad-financiera/pull/12) | ✅ |
| 6.8 | Frontend: consignaciones y retiros | `feature/frontend-deposits-withdrawals` | [#13](https://github.com/Sofialjure/prueba-tecnica-entidad-financiera/pull/13) | ✅ |
| 6.9 | Frontend: transferencias | `feature/frontend-transfers` | [#14](https://github.com/Sofialjure/prueba-tecnica-entidad-financiera/pull/14) | ✅ |
| 6.10 | Frontend: estado de cuenta | `feature/frontend-statement` | [#15](https://github.com/Sofialjure/prueba-tecnica-entidad-financiera/pull/15) | ✅ |
| 6.11 | Frontend: sobregiro visible y cuentas del mismo titular | `feature/frontend-overdraft-visibility` | [#17](https://github.com/Sofialjure/prueba-tecnica-entidad-financiera/pull/17) | ✅ |
| 7.1 | Docker: imagen del backend | `feature/docker-backend` | — | ⏳ |
| 7.2 | Docker: imagen del frontend (Nginx) | `feature/docker-frontend` | — | ⏳ |
| 7.3 | Docker Compose con los 3 contenedores | `feature/docker-compose` | — | ⏳ |
| 8.1 | CI: pipeline del backend | `feature/ci-backend` | — | ⏳ |
| 8.2 | CI: pipeline del frontend | `feature/ci-frontend` | — | ⏳ |
| 8.3 | CI: reportes de cobertura | `feature/ci-coverage` | — | ⏳ |
| 9.1 | Nube: elección del proveedor (ADR) | `feature/cloud-decision` | — | ⏳ |
| 9.2 | Nube: despliegue | `feature/cloud-deploy` | — | ⏳ |
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

### 4. Cuentas ✅

- [x] Modelo de dominio `Account` con reglas por tipo (ahorros / corriente), patrón Strategy
- [x] Crear cuenta con número automático de 10 dígitos: 53 ahorros, 33 corriente (RF-09 a RF-13), patrón Factory
- [x] Activar, inactivar y cancelar con saldo $0 (RF-15, RF-16)
- [x] Consultar una cuenta y las cuentas de un cliente (RF-19)
- [x] Tests unitarios de Service y Controller (cobertura 100 % en ambas capas)
- [x] 4.1 Al cancelar una cuenta corriente se cierra su cupo de sobregiro (SUP-14), hallado en la revisión del frontend

### 5. Transacciones ✅

- [x] Consignación, retiro y transferencia (RF-20, RF-21, RF-22)
- [x] Actualización de saldo y saldo disponible (RF-18, RF-23)
- [x] GMF 4×1000 en cuentas no exentas (SUP-10)
- [x] Bloqueo de cuentas para operaciones simultáneas (RNF-10), también al activar, inactivar o cancelar
- [x] Estado de cuenta (RF-24)
- [x] Tests unitarios de Service y Controller (cobertura 100 %), y prueba de concurrencia contra PostgreSQL real

### 6. Frontend ✅

- [x] 6.1 Proyecto Angular 22 con Angular Material, layout con menú lateral, proxy a la API, formato de moneda colombiana
- [x] 6.1 Mensajes de error de la API visibles para el usuario (interceptor HTTP)
- [x] 6.2 Componentes reutilizables (encabezado de página, diálogo de confirmación, estado de la cuenta, estado vacío) y textos en español de los valores de la API
- [x] 6.3 Listado de clientes con búsqueda, y eliminación con confirmación
- [x] 6.4 Formulario de cliente (crear y editar) con las mismas validaciones de la API
- [x] 6.5 Rediseño visual: menú lateral azul marino con acento dorado, panel principal con indicadores reales, tablas sin cuadrícula con avatares, formularios por secciones, calendario desplegable
- [x] 6.6 Detalle del cliente con sus cuentas (tarjetas tipo bancarias) y apertura de cuentas
- [x] 6.7 Activar, inactivar y cancelar cuentas desde el menú de cada tarjeta, con confirmación
- [x] 6.8 Consignaciones y retiros con vista previa del GMF, validación del saldo disponible y comprobante
- [x] 6.9 Transferencias con el GMF de la cuenta de origen, sin permitir la misma cuenta como destino
- [x] 6.10 Estado de cuenta con totales, filtro por tipo de movimiento y descarga en CSV
- [x] 6.11 Sobregiro visible (en uso, cupo, saldo después de cada débito) y cuentas del mismo titular marcadas al transferir, hallados en la revisión

### 7. Contenedores ⏳

- [ ] 7.1 Dockerfile multi-stage del backend
- [ ] 7.2 Dockerfile multi-stage del frontend (Nginx)
- [ ] 7.3 Docker Compose con los 3 contenedores: `docker compose up --build`

### 8. Integración continua ⏳

- [ ] 8.1 GitHub Actions: compilar y ejecutar los tests del backend en cada PR
- [ ] 8.2 GitHub Actions: compilar y ejecutar los tests del frontend en cada PR
- [ ] 8.3 Reportes de cobertura (JaCoCo y Vitest)

### 9. Despliegue en la nube ⏳

- [ ] 9.1 Elegir proveedor y registrar la decisión en un ADR
- [ ] 9.2 Desplegar base de datos, backend y frontend, y documentar los servicios usados ([Despliegue](06-despliegue.md))

### 10. Versión 1.0.0 ⏳

- [ ] Rama `release/1.0.0`, revisión final de la documentación
- [ ] Integración a `main` con el tag `v1.0.0`
