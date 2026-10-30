# ADR-0002: PostgreSQL como base de datos y Flyway para migraciones

**Estado:** Aceptada

## Contexto

Se debe usar SQL Server, Oracle, PostgreSQL o MySQL. La prueba evalúa explícitamente el manejo de **DDL y DML**, y la solución debe ser dockerizada.

## Decisión

- **PostgreSQL 16**: es libre, tiene imagen Docker oficial liviana y soporta todo lo necesario: transacciones ACID robustas, `SELECT ... FOR UPDATE`, `CHECK` constraints, secuencias, columnas generadas y el tipo `NUMERIC` exacto.
- **Flyway** para versionar el esquema con scripts **SQL puros** (`V1__crear_tablas.sql` para DDL y `V2__datos_iniciales.sql` para DML).
- Hibernate se configura con `ddl-auto=validate`: valida que las entidades coincidan con el esquema, pero **nunca lo modifica**.

## Alternativas consideradas

- `ddl-auto=update`: se descarta porque no hay control del SQL generado, no queda historial y no se recomienda en producción.
- **Liquibase**: es válido, pero sus *changelogs* en XML/YAML ocultan el SQL que se quiere evidenciar.

## Consecuencias

- ✅ El esquema queda versionado junto al código y es reproducible en cualquier ambiente.
- ✅ El DDL y el DML quedan visibles y revisables en el repositorio.
- ⚠️ Una migración aplicada no se debe modificar. Los cambios se hacen con nuevas versiones (`V3__...`).
