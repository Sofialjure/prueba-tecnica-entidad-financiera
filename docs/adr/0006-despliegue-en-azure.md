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
| Región | `northcentralus` (centro-norte de EE. UU.) | La más económica de las permitidas que ofrece servidores x64 pequeños a esta suscripción. |
| Tamaño | `Standard_B2als_v2` (2 vCPU AMD, 4 GiB de RAM, serie B ampliable) | El más barato disponible para la suscripción con procesador x64: 0,0468 USD/hora, unos 34 USD/mes encendida (precio público de Azure, oct. 2026). Se suma un *swap* de 2 GiB. |
| Disco | SSD estándar de 32 GiB (E4) | Unos 2,40 USD/mes, se cobra aunque la máquina esté apagada. |
| Sistema operativo | Ubuntu Server 24.04 LTS | Versión con soporte largo y Docker oficial disponible. |
| Red | Solo los puertos 443 y 80 abiertos a internet; SSH (22) solo desde la IP de la administradora | La API y PostgreSQL no quedan expuestos: el navegador solo habla con Caddy, que pasa todo a Nginx. |
| HTTPS | Caddy con un certificado gratuito de Let's Encrypt para el dominio de Azure | Candado en el navegador, tráfico cifrado y renovación automática. Sin HTTPS los celulares no cargaban la página. |
| Dirección | IP pública con nombre DNS de Azure (`*.westus2.cloudapp.azure.com`) | Una URL legible para el README sin comprar un dominio. |

### Por qué no el tamaño más pequeño

La primera opción era `Standard_B1ms` (1 vCPU, 2 GiB, unos 15 USD/mes). Al consultar los tamaños permitidos para la suscripción (`az vm list-skus`), `B1ms` **no está disponible** en ninguna de las cinco regiones, y varios tamaños pequeños aparecen como `NotAvailableForSubscription`. Entre los permitidos:

| Opción | Región | Tamaño | Procesador | USD/mes encendida |
|---|---|---|---|---|
| **Elegida** | `northcentralus` | `B2als_v2` (2 vCPU, 4 GiB) | x64 | 34,16 |
| Descartada | `westus2` / `northcentralus` | `B2pls_v2` (2 vCPU, 4 GiB) | ARM | 31,24 |
| Descartada | `francecentral` | `B2als_v2` | x64 | 37,74 |
| Descartada | `chilecentral` | `B2als_v2` | x64 | 38,40 |

La opción ARM ahorra 3 USD al mes, pero obligaría a construir las imágenes Docker para otra arquitectura de procesador. Con x64 se usan las mismas imágenes que en local y en la CI.

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
- ✅ **Costo predecible:** unos 40 USD/mes encendida (máquina + disco + IP) y unos 6 USD/mes apagada (*desasignada*), en la que solo se paga el disco y la IP. Una alerta de presupuesto avisa por correo al llegar a 16 y 20 USD al mes. Se puede borrar todo eliminando un único grupo de recursos.
- ✅ **Sin riesgo de cobros:** la suscripción no tiene medio de pago; al agotarse el crédito Azure la deshabilita en lugar de cobrar.
- ⚠️ **Un solo servidor:** si la máquina falla, la aplicación se cae. Es aceptable para una prueba técnica, no para producción.
- ✅ **HTTPS gratuito y automático** con Let's Encrypt. Para producción se usaría un dominio propio en lugar del de Azure.
- ⚠️ **Copias de seguridad:** la base de datos vive en un volumen del disco de la máquina. En producción se usaría Azure Database for PostgreSQL, con copias automáticas.
