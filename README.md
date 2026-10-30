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

## Ejecución con Docker

> Disponible cuando se integre la rama de contenedores.

```bash
docker compose up --build
```

| Servicio | URL |
|---|---|
| Frontend | http://localhost:4200 |
| API REST | http://localhost:8080/api/v1 |
| Swagger UI | http://localhost:8080/swagger-ui.html |

## Documentación

| # | Documento | Contenido |
|---|---|---|
| 1 | [Requerimientos](docs/01-requerimientos.md) | Requerimientos funcionales, no funcionales y supuestos |
| 2 | [Arquitectura](docs/02-arquitectura.md) | Hexagonal, patrones de diseño, SOLID y ACID |
| 3 | [Modelo de datos](docs/03-modelo-datos.md) | Diagrama entidad-relación, DDL y DML |
| 4 | [API REST](docs/04-api.md) | Endpoints, ejemplos y manejo de errores |
| 5 | [Git Flow](docs/05-git-flow.md) | Estrategia de ramas y convención de commits |
| 6 | [Despliegue](docs/06-despliegue.md) | Docker y servicios en la nube |
| — | [Decisiones de arquitectura (ADR)](docs/adr/) | Por qué se tomó cada decisión técnica |

## Autora

**Sofía Aljure** — [@Sofialjure](https://github.com/Sofialjure)
