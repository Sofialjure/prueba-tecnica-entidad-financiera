# ADR-0005: Código en inglés y documentación en español

**Estado:** Aceptada

## Contexto

El enunciado y el negocio están en español, pero el código convive con frameworks, librerías y convenciones que están en inglés (`findById`, `save`, `@Transactional`...). Mezclar idiomas en un mismo identificador (`findClienteByNumeroCuenta`) dificulta la lectura y rompe la consistencia.

## Decisión

| Elemento | Idioma |
|---|---|
| Código: clases, métodos, variables, paquetes internos | Inglés |
| API REST: rutas y campos JSON | Inglés |
| Base de datos: tablas, columnas, restricciones y scripts Flyway | Inglés |
| Mensajes de commit, nombres de ramas y títulos de PR | Inglés |
| Documentación (`README.md`, `/docs`, ADRs) y descripciones de PR | Español |
| Mensajes de error y textos de la interfaz | Español (los leen los trabajadores de la entidad) |

Los códigos propios del dominio colombiano se conservan tal cual: `CC`, `CE`, `PA` y `GMF`. La raíz del paquete (`com.pruebatecnica.entidadfinanciera`) sigue el nombre del proyecto.

El [glosario del modelo de datos](../03-modelo-datos.md#glosario) relaciona los términos del negocio con los identificadores del código.

## Consecuencias

- ✅ El código es consistente con el ecosistema Java/Spring/Angular y legible para cualquier equipo.
- ✅ La documentación queda en el idioma del negocio y del evaluador.
- ⚠️ Hay que traducir mentalmente entre términos del negocio y del código. Se mitiga con el glosario.
