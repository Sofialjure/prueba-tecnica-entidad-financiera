# ADR-0003: Angular para el frontend

**Estado:** Aceptada

## Contexto

La prueba exige un frontend basado en componentes que consuma la API REST.

## Decisión

Construir una **SPA en Angular** con TypeScript y **Angular Material** como librería de componentes visuales.

## Alternativas consideradas

- **React**: es flexible, pero requiere elegir y configurar librerías aparte para enrutamiento, formularios y peticiones HTTP.

## Consecuencias

- ✅ Es un framework completo: incluye router, formularios reactivos con validaciones y `HttpClient`.
- ✅ Su modelo de servicios e inyección de dependencias es análogo al de Spring, lo que da coherencia entre front y back.
- ✅ Usa TypeScript con tipado estricto por defecto.
- ✅ Es ampliamente usado en el sector financiero.
- ⚠️ La curva de aprendizaje inicial es mayor que la de React.
