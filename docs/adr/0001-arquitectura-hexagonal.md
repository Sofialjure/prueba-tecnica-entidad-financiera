# ADR-0001: Arquitectura hexagonal en el backend

**Estado:** Aceptada

## Contexto

El enunciado pide arquitectura hexagonal "en lo posible" o MVC, y exige las capas entity, service, controller y repository. Las reglas de negocio (mayoría de edad, saldos, estados de cuenta, GMF) son el núcleo del sistema y deben poder probarse sin base de datos ni servidor web.

## Decisión

Usar **arquitectura hexagonal** (puertos y adaptadores) con tres módulos lógicos: `domain`, `application` e `infrastructure`. Las capas exigidas existen como paquetes dentro de la estructura hexagonal: `application.service`, `adapter.in.rest.controller`, `adapter.out.persistence.entity` y `adapter.out.persistence.repository`.

## Consecuencias

- ✅ El dominio es independiente de Spring y JPA, así que los tests unitarios son rápidos y simples.
- ✅ Se puede cambiar la persistencia o la exposición (REST, mensajería) sin tocar el negocio.
- ✅ Se cumplen al mismo tiempo la arquitectura preferida y las capas exigidas.
- ⚠️ Hay más clases y mapeos (dominio ↔ entidad ↔ DTO) que en un MVC tradicional. Se mitiga con MapStruct.
