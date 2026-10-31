# Prueba Técnica — Sistema de Gestión Bancaria

[![Backend](https://github.com/Sofialjure/prueba-tecnica-entidad-financiera/actions/workflows/backend.yml/badge.svg?branch=develop)](https://github.com/Sofialjure/prueba-tecnica-entidad-financiera/actions/workflows/backend.yml)
[![Frontend](https://github.com/Sofialjure/prueba-tecnica-entidad-financiera/actions/workflows/frontend.yml/badge.svg?branch=develop)](https://github.com/Sofialjure/prueba-tecnica-entidad-financiera/actions/workflows/frontend.yml)

Aplicación para los trabajadores de una entidad financiera que permite administrar **clientes**, sus **productos financieros** (cuentas de ahorro y corriente) y los **movimientos transaccionales** (consignaciones, retiros y transferencias), con consulta de estados de cuenta.

> ✅ Todos los requisitos del enunciado están implementados y probados: ver la [trazabilidad requisito → prueba](docs/07-trazabilidad.md). El avance completo está en el [plan de trabajo](docs/00-plan-de-trabajo.md) y en el historial de Pull Requests.

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Backend | Java 21 · Spring Boot 4 · Spring Data JPA · Bean Validation · MapStruct |
| Base de datos | PostgreSQL 16 · Flyway (migraciones DDL/DML) |
| Documentación API | OpenAPI 3 · Swagger UI (springdoc) |
| Pruebas | JUnit 5 · Mockito · MockMvc · JaCoCo |
| Frontend | Angular · TypeScript · Angular Material |
| Contenedores | Docker · Docker Compose · Nginx |
| CI/CD | GitHub Actions |

## Arquitectura

Backend con **arquitectura hexagonal (puertos y adaptadores)**. El dominio no depende de frameworks ni de la base de datos. Los detalles están en [Arquitectura](docs/02-arquitectura.md).

## Estructura del repositorio

```
prueba-tecnica-entidad-financiera/
├── backend/             # API REST (Spring Boot)
├── frontend/            # SPA (Angular)
├── docs/                # Documentación técnica
├── docker-compose.yml   # Orquestación de contenedores
└── README.md
```

## Aplicación en línea

**https://entidad-financiera-sofia.northcentralus.cloudapp.azure.com**

Desplegada en una máquina virtual de **Microsoft Azure** con el mismo Docker Compose ([detalles y costos](docs/06-despliegue.md#63-servicios-en-la-nube), [decisión](docs/adr/0006-despliegue-en-azure.md)). Si no responde, puede estar apagada para ahorrar crédito.

## Inicio rápido con Docker

Solo se necesita **Docker**: no hace falta tener Java ni Node instalados.

```bash
cp .env.example .env      # opcional: credenciales y puertos
docker compose up --build
```

La primera vez tarda unos minutos, porque compila el backend y el frontend dentro de Docker. Los contenedores arrancan en orden: primero la base de datos, cuando está sana la API (que aplica las migraciones Flyway) y cuando la API está sana el frontend.

| Servicio | URL |
|---|---|
| Aplicación web | http://localhost:4300 |
| API REST | http://localhost:8080/api/v1 |
| Swagger UI | http://localhost:8080/swagger-ui.html |

- **Puertos ocupados:** se cambian en `.env` (`FRONTEND_PORT`, `BACKEND_PORT`, `DB_PORT`) o al lanzar el comando. En PowerShell: `$env:DB_PORT="5433"; docker compose up --build`.
- **Detener:** `docker compose down`. Los datos quedan en el volumen `pgdata`; `docker compose down -v` los borra y la próxima vez arranca con los datos de ejemplo.

## Ejecución local del backend (desarrollo)

Requisitos: **Java 21** y **Docker** (para la base de datos y para los tests de integración).

```bash
# 1. Base de datos PostgreSQL (si el puerto 5432 está ocupado: DB_PORT=5433 docker compose up -d postgres)
docker compose up -d postgres

# 2. API REST (con el mismo DB_PORT si se cambió en el paso 1)
cd backend
./mvnw spring-boot:run
```

En Windows PowerShell, todo en la misma ventana (las variables solo valen para esa ventana):

```powershell
# Solo si JAVA_HOME apunta a otra versión de Java (error "UnsupportedClassVersionError")
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot"
# Solo si el puerto 5432 está ocupado
$env:DB_PORT = "5433"

docker compose up -d postgres
cd backend
.\mvnw.cmd spring-boot:run
```

- Swagger UI: http://localhost:8080/swagger-ui.html
- Tests y reporte de cobertura: `./mvnw verify` → `backend/target/site/jacoco/index.html`. El build falla si la cobertura baja de los mínimos (100 % en Service y Controller).

## Ejecución local del frontend (desarrollo)

Requisitos: **Node.js 22 o superior** y el backend corriendo en el puerto 8080.

```bash
cd frontend
npm install
npm start
```

- Aplicación: http://localhost:4300 (se usa el 4300 y no el 4200 por defecto de Angular, para no chocar con otros proyectos)
- Las llamadas a `/api` se redirigen al backend con `proxy.conf.json`, así que no se necesita CORS.
- Tests: `npm test` · con cobertura: `npm run test:coverage` → `frontend/coverage/frontend/index.html`

## Documentación

| # | Documento | Contenido |
|---|---|---|
| 0 | [Plan de trabajo](docs/00-plan-de-trabajo.md) | Fases del proyecto y avance |
| 1 | [Requerimientos](docs/01-requerimientos.md) | Requerimientos funcionales, no funcionales y supuestos |
| 2 | [Arquitectura](docs/02-arquitectura.md) | Hexagonal, patrones de diseño, SOLID y ACID |
| 3 | [Modelo de datos](docs/03-modelo-datos.md) | Diagrama entidad-relación, DDL y DML |
| 4 | [API REST](docs/04-api.md) | Endpoints, ejemplos y manejo de errores |
| 5 | [Git Flow](docs/05-git-flow.md) | Estrategia de ramas y convención de commits |
| 6 | [Despliegue](docs/06-despliegue.md) | Docker, integración continua y servicios en la nube |
| 7 | [Trazabilidad](docs/07-trazabilidad.md) | Cada requisito con su implementación y las pruebas que lo demuestran |
| — | [Decisiones de arquitectura (ADR)](docs/adr/) | Por qué se tomó cada decisión técnica |

## Autora

**Sofía Aljure** — [@Sofialjure](https://github.com/Sofialjure)
