# Prueba Técnica — Sistema de Gestión Bancaria

Aplicación para los trabajadores de una entidad financiera que permite administrar **clientes**, sus **productos financieros** (cuentas de ahorro y corriente) y los **movimientos transaccionales** (consignaciones, retiros y transferencias), con consulta de estados de cuenta.

> 🚧 Proyecto en construcción. El avance se puede seguir en el historial de commits y Pull Requests.

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

## Ejecución local del backend

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
- Tests y reporte de cobertura: `./mvnw verify` → `backend/target/site/jacoco/index.html`

## Ejecución local del frontend

Requisitos: **Node.js 22 o superior** y el backend corriendo en el puerto 8080.

```bash
cd frontend
npm install
npm start
```

- Aplicación: http://localhost:4300 (se usa el 4300 y no el 4200 por defecto de Angular, para no chocar con otros proyectos)
- Las llamadas a `/api` se redirigen al backend con `proxy.conf.json`, así que no se necesita CORS.
- Tests: `npm test`

## Ejecución con Docker

> El `docker compose up --build` con los 3 contenedores llega en el PR 7.3. Por ahora se puede construir y probar la imagen del backend:

```bash
# Imagen del backend (compila con Maven dentro de Docker; no hace falta Java instalado)
docker build -t entidad-financiera-backend ./backend

# Ejecutarla junto a la base de datos del docker-compose actual
docker compose up -d postgres
docker run --rm -p 8080:8080 --network prueba-tecnica-entidad-financiera_default   -e DB_HOST=entidad-financiera-db -e DB_PORT=5432 entidad-financiera-backend
```

| Servicio | URL |
|---|---|
| Frontend | http://localhost:4300 |
| API REST | http://localhost:8080/api/v1 |
| Swagger UI | http://localhost:8080/swagger-ui.html |

## Documentación

| # | Documento | Contenido |
|---|---|---|
| 0 | [Plan de trabajo](docs/00-plan-de-trabajo.md) | Fases del proyecto y avance |
| 1 | [Requerimientos](docs/01-requerimientos.md) | Requerimientos funcionales, no funcionales y supuestos |
| 2 | [Arquitectura](docs/02-arquitectura.md) | Hexagonal, patrones de diseño, SOLID y ACID |
| 3 | [Modelo de datos](docs/03-modelo-datos.md) | Diagrama entidad-relación, DDL y DML |
| 4 | [API REST](docs/04-api.md) | Endpoints, ejemplos y manejo de errores |
| 5 | [Git Flow](docs/05-git-flow.md) | Estrategia de ramas y convención de commits |
| 6 | [Despliegue](docs/06-despliegue.md) | Docker y servicios en la nube |
| — | [Decisiones de arquitectura (ADR)](docs/adr/) | Por qué se tomó cada decisión técnica |

## Autora

**Sofía Aljure** — [@Sofialjure](https://github.com/Sofialjure)
