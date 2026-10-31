# ADR-0006: Despliegue en una máquina virtual de Azure con Docker Compose

**Estado:** Aceptada

## Contexto

La prueba evalúa el uso de **servicios en la nube**. La aplicación ya corre completa con `docker compose up --build` (fase 7). Hay tres restricciones:

- **Sin tarjeta de crédito:** la autora no quiere registrar una tarjeta. AWS, Google Cloud, Oracle y la cuenta gratuita normal de Azure la exigen, aunque no cobren.
- **Explicable:** la solución debe poder contarse en pocas frases en una entrevista.
- **Costo controlado:** tiene que caber en el crédito disponible y poder apagarse o borrarse fácilmente.

La autora tiene una suscripción **Azure for Students** (verificada con su correo institucional): no pide tarjeta e incluye crédito por 12 meses. Esa suscripción solo permite crear recursos en `westus2`, `northcentralus`, `chilecentral`, `brazilsouth` y `francecentral`.

## Decisión

Desplegar en **una sola máquina virtual Linux de Azure** que ejecuta el **mismo `docker-compose.yml`** del proyecto.

| Recurso | Elección | Por qué |
|---|---|---|
| Suscripción | Azure for Students | Sin tarjeta y sin posibilidad de cobros: solo consume el crédito de estudiante. |
| Región | `westus2` | La más económica de las permitidas: un 40 % menos que `chilecentral` y casi la mitad que `brazilsouth` para el mismo tamaño. |
| Tamaño | `Standard_B1ms` (1 vCPU, 2 GB de RAM) | Alcanza para PostgreSQL, la API y Nginx con un archivo de intercambio (*swap*). Unos 15 USD/mes encendida (precio público de Azure, oct. 2026). |
| Sistema operativo | Ubuntu Server 24.04 LTS | Versión con soporte largo y Docker oficial disponible. |
| Red | Solo el puerto 80 abierto a internet; SSH (22) solo desde la IP de la administradora | La API y PostgreSQL no quedan expuestos: el navegador solo habla con Nginx. |
| Dirección | IP pública con nombre DNS de Azure (`*.westus2.cloudapp.azure.com`) | Una URL legible para el README sin comprar un dominio. |

## Alternativas consideradas

| Alternativa | Por qué no |
|---|---|
| **AWS EC2** con el plan gratuito | Exige tarjeta de crédito al crear la cuenta. |
| **Render** (plan gratuito, sin tarjeta) | El backend se apaga tras 15 minutos sin uso (la primera visita tarda cerca de un minuto) y la base de datos gratuita expira a los 30 días. |
| **Servicios administrados de Azure** (App Service, Azure Database for PostgreSQL, Static Web Apps) | Más piezas que configurar y explicar, y más consumo de crédito. La aplicación ya está empaquetada para Docker Compose: migrar después a servicios administrados no exige cambiar el código, porque la conexión llega por variables de entorno. |
| **Kubernetes (AKS)** | Desproporcionado para tres contenedores y costoso para el crédito disponible. |

## Consecuencias

- ✅ **Mismo comportamiento que en local:** son los mismos contenedores, *healthchecks* y orden de arranque.
- ✅ **Fácil de explicar:** "la misma aplicación con Docker, corriendo en un servidor de Azure".
- ✅ **Costo predecible:** apagada (*desasignada*) solo se paga el disco y la IP; se puede borrar todo eliminando un único grupo de recursos.
- ⚠️ **Un solo servidor:** si la máquina falla, la aplicación se cae. Es aceptable para una prueba técnica, no para producción.
- ⚠️ **HTTP sin TLS:** para producción se agregaría HTTPS (por ejemplo con Let's Encrypt y un dominio propio).
- ⚠️ **Copias de seguridad:** la base de datos vive en un volumen del disco de la máquina. En producción se usaría Azure Database for PostgreSQL, con copias automáticas.
