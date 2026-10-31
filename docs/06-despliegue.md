# 6. Despliegue

## 6.1 Contenedores

La solución corre en **3 contenedores** orquestados con Docker Compose:

| Contenedor | Imagen base | Puerto | Responsabilidad |
|---|---|---|---|
| `postgres` | `postgres:16-alpine` | 5432 | Base de datos, con volumen persistente. |
| `backend` | `eclipse-temurin:21-jre-alpine` | 8080 | API REST. Al arrancar aplica las migraciones Flyway. |
| `frontend` | `nginxinc/nginx-unprivileged:alpine` | 4300 → 8080 | Sirve la SPA compilada de Angular y redirige `/api` al backend. |

```mermaid
flowchart LR
    B[Navegador] -->|:4300| FE[frontend<br/>nginx]
    FE -->|/api| BE[backend<br/>Spring Boot]
    B -.->|:8080 Swagger| BE
    BE -->|:5432| DB[(postgres)]
    DB --- V[(volumen<br/>pgdata)]
```

- Las imágenes del backend y del frontend usan **builds multi-stage**: una etapa compila (Maven / Node) y otra ejecuta, con lo que la imagen final queda liviana.

### Imagen del backend (`backend/Dockerfile`)

| Aspecto | Decisión |
|---|---|
| Compilación | `eclipse-temurin:21-jdk-alpine` con el Maven wrapper del proyecto. Primero se copian `pom.xml` y el wrapper y se descargan las dependencias, para que Docker las reutilice mientras solo cambie el código. La caché de `~/.m2` se monta con BuildKit. |
| Tests | Se omiten en la imagen (`-DskipTests`): los de integración necesitan Docker (Testcontainers) y se ejecutan en la integración continua. |
| Ejecución | `eclipse-temurin:21-jre-alpine`: solo el JRE, sin JDK ni Maven. |
| Capas | El JAR se separa con `-Djarmode=tools extract --layers` en dependencias, *loader*, dependencias *snapshot* y aplicación. Un cambio de código solo reconstruye la última capa. |
| Seguridad | Corre con el usuario sin privilegios `app`, no como `root`. |
| Memoria | `-XX:MaxRAMPercentage=75`: el *heap* se ajusta al límite de memoria del contenedor. |
| Salud | `HEALTHCHECK` contra `/actuator/health`: Docker marca el contenedor como *healthy* cuando la API responde `UP`. |
| Configuración | Variables de entorno `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD` y `SERVER_PORT` (ver `application.yml`). |

### Imagen del frontend (`frontend/Dockerfile`)

| Aspecto | Decisión |
|---|---|
| Compilación | `node:24-alpine` (Angular 22 pide Node 22.22 o 24.15+). `npm ci` con `package-lock.json` y caché de npm de BuildKit; luego `npm run build`. |
| Ejecución | `nginxinc/nginx-unprivileged:alpine`: solo los archivos estáticos (≈ 93 MB), con Nginx corriendo sin `root` en el puerto 8080. |
| Un solo origen | Nginx redirige `/api/` al backend (`BACKEND_URL`, por defecto `http://backend:8080`), igual que `proxy.conf.json` en desarrollo. El navegador nunca habla con otro dominio, así que no se necesita CORS. |
| Rutas de Angular | `try_files ... /index.html`: abrir directamente `/customers/1` o recargar la página funciona. |
| Caché | Los JS y CSS llevan un *hash* en el nombre, así que se guardan un año (`immutable`). `index.html` va con `no-cache`, para tomar enseguida una versión nueva. |
| Compresión | `gzip` para JS, CSS, JSON y SVG. |
| Seguridad | Sin versión de Nginx en las respuestas y con las cabeceras `X-Content-Type-Options`, `X-Frame-Options` y `Referrer-Policy` en todas las rutas (`nginx/security-headers.conf`). |
| Salud | `HEALTHCHECK` contra `http://127.0.0.1:8080/` (no `localhost`, que dentro del contenedor resuelve primero a IPv6). |
- El backend espera a que PostgreSQL esté saludable (`healthcheck` + `depends_on`).
- La configuración sensible (credenciales de BD) se inyecta con variables de entorno (archivo `.env`, que no se versiona).

### Levantar el proyecto

```bash
cp .env.example .env
docker compose up --build
```

### Orquestación (`docker-compose.yml`)

| Servicio | Contenedor | Puerto en el equipo | Espera a |
|---|---|---|---|
| `postgres` | `entidad-financiera-db` | `DB_PORT` (5432) | — |
| `backend` | `entidad-financiera-api` | `BACKEND_PORT` (8080) | `postgres` *healthy* (`pg_isready`) |
| `frontend` | `entidad-financiera-web` | `FRONTEND_PORT` (4300) | `backend` *healthy* (`/actuator/health`) |

- **Arranque en orden:** `depends_on` con `condition: service_healthy`. La API no intenta conectarse antes de que PostgreSQL acepte conexiones, y Nginx no recibe tráfico antes de que la API responda.
- **Red interna:** los contenedores se encuentran por nombre de servicio. El backend usa siempre `postgres:5432` y Nginx `http://backend:8080`, sin importar los puertos publicados en el equipo.
- **Configuración:** credenciales y puertos en `.env` (plantilla `.env.example`, sin versionar el `.env`). Cada variable tiene un valor por defecto, así que `docker compose up --build` funciona sin `.env`.
- **Datos persistentes:** volumen `pgdata`. `docker compose down` conserva los datos; `docker compose down -v` los borra.
- **Reinicio:** `restart: unless-stopped` en los tres servicios.

## 6.2 Integración continua

Pipelines de **GitHub Actions** en cada push y Pull Request a `develop` y `main`. Cada uno se ejecuta solo cuando cambia su parte del repositorio (filtro `paths`), y un push nuevo cancela la ejecución anterior de la misma rama (`concurrency`).

### Backend (`.github/workflows/backend.yml`)

| Trabajo | Qué hace |
|---|---|
| **Compilar y probar** | Java 21 (Temurin) con caché de Maven y `./mvnw verify`: tests unitarios, tests de integración contra PostgreSQL real (Testcontainers usa el Docker del servidor de GitHub), reporte JaCoCo y sus mínimos de cobertura. Publica la tabla de cobertura en el resumen de la ejecución y guarda el reporte HTML como artefacto (`backend-coverage`, 14 días). Si algo falla, guarda también los reportes de Surefire (7 días). |
| **Construir imagen Docker** | Solo si los tests pasan. Construye `backend/Dockerfile` con Buildx y caché de GitHub Actions, sin publicarla. Comprueba que el Dockerfile sigue funcionando. |

Permisos mínimos: `contents: read`.

### Cobertura mínima

Los dos pipelines **fallan si la cobertura baja** de estos mínimos:

| Proyecto | Regla | Valor actual |
|---|---|---|
| Backend (JaCoCo, `pom.xml`) | Clases de `application.service` y `adapter.in.rest.controller`: **100 %** de líneas y ramas | 100 % |
| Backend | Todo el proyecto: ≥ 95 % de líneas y ≥ 90 % de ramas | 100 % / 100 % |
| Frontend (Vitest, `angular.json`) | ≥ 95 % de sentencias y líneas, ≥ 90 % de ramas y funciones | 98,5 % · 98,8 % · 94,4 % · 96,3 % |

Se excluye del cálculo el código que no se escribe a mano: las implementaciones generadas por MapStruct (`*MapperImpl`), la clase `main` del backend y los datos de prueba del frontend (`testing/`). Un script común (`.github/scripts/coverage_summary.py`) convierte los reportes en la tabla del resumen de cada ejecución.

### Frontend (`.github/workflows/frontend.yml`)

| Trabajo | Qué hace |
|---|---|
| **Probar y compilar** | Node 24 con caché de npm, `npm ci`, tests unitarios con cobertura (`npm run test:coverage`, Vitest + V8) y compilación de producción (`npm run build`), que falla si el paquete inicial supera el presupuesto de error de `angular.json`. Publica la tabla de cobertura en el resumen de la ejecución y guarda el reporte HTML (`frontend-coverage`, 14 días). |
| **Construir imagen Docker** | Solo si lo anterior pasa. Construye `frontend/Dockerfile` (Node + Nginx) con Buildx y caché de GitHub Actions, sin publicarla. |

Permisos mínimos: `contents: read`.

## 6.3 Servicios en la nube

La aplicación se publica en **Microsoft Azure**: una máquina virtual Linux (`Standard_B2als_v2`, región `northcentralus`) que ejecuta el mismo Docker Compose. Los motivos, las alternativas y las consecuencias están en el [ADR-0006](adr/0006-despliegue-en-azure.md).

**Aplicación en línea:** https://entidad-financiera-sofia.northcentralus.cloudapp.azure.com

```text
Navegador ──https:443──► Azure (northcentralus) · VM Standard_B2als_v2 · Ubuntu 24.04 LTS
                         └─ Docker Compose: Caddy (HTTPS) ──► frontend (nginx) ──/api──► backend ──► postgres
```

### Recursos en Azure

Todos viven en un solo grupo de recursos, **`rg-entidad-financiera`**, de la suscripción **Azure for Students** (sin tarjeta de crédito).

| Recurso | Nombre | Configuración | Costo aprox. |
|---|---|---|---|
| Máquina virtual | `vm-entidad-financiera` | `Standard_B2als_v2` (2 vCPU AMD, 4 GiB) + 2 GiB de *swap*, Ubuntu Server 24.04 LTS | 34,16 USD/mes encendida; 0 USD apagada |
| Disco | `vm-entidad-financiera_OsDisk_…` | SSD estándar de 32 GiB | 2,40 USD/mes, siempre |
| IP pública | `vm-entidad-financieraPublicIP` | Estándar estática, con nombre DNS `entidad-financiera-sofia` | 3,65 USD/mes, siempre |
| Firewall | `vm-entidad-financieraNSG` | Solo tres reglas de entrada (ver seguridad) | Gratis |
| Certificado HTTPS | Let's Encrypt, emitido y renovado por Caddy | Válido 90 días, se renueva solo | Gratis |
| Red e interfaz | `vm-entidad-financieraVNET`, `…VMNic` | Red privada de la máquina | Gratis |
| Alerta de presupuesto | `presupuesto-entidad-financiera` | 20 USD/mes; correo al 80 % y al 100 % del gasto real | Gratis |

**Total:** unos **40 USD/mes encendida** y **6 USD/mes apagada**, descontados del crédito de estudiante. Precios públicos de Azure (oct. 2026); la salida de datos es gratuita hasta 100 GB/mes. Si el crédito se agota, Azure deshabilita la suscripción: no hay medio de pago, así que no puede haber cobros.

### Seguridad

| Medida | Detalle |
|---|---|
| Firewall de Azure | Entrada solo por los puertos **443** (HTTPS) y **80** (redirige a HTTPS) desde internet, y el **22** (SSH) desde la IP de la administradora. Los puertos 8080 y 5432 no responden desde internet (verificado). |
| HTTPS | **Caddy** (`deploy/azure/Caddyfile`) obtiene un certificado gratuito de **Let's Encrypt** para el dominio de Azure y lo renueva solo. Redirige `http://` a `https://` (308) y envía `Strict-Transport-Security`. Sin HTTPS, los celulares no cargaban la página: intentan primero el puerto 443. |
| Puertos de los contenedores | `docker-compose.azure.yml` quita los puertos publicados de PostgreSQL, de la API y de Nginx (`ports: !reset []`): solo se hablan por la red interna de Docker. Los únicos puertos publicados son el 80 y el 443 de Caddy. Por eso Swagger no es público en Azure. |
| Llave SSH | `ed25519` sin contraseña en `~/.ssh/entidad-financiera-azure` de la administradora, fuera del repositorio. Solo la parte pública está en el servidor, y el `.gitignore` excluye patrones de llaves por si acaso. |
| Contraseña de la base de datos | Aleatoria (32 caracteres), generada en el servidor dentro de un `.env` con permisos `600`. Nunca pasa por el repositorio ni por el computador local. |
| Memoria | Límites por contenedor (PostgreSQL 512 MiB, API 768 MiB, Nginx 128 MiB, Caddy 64 MiB) para que la JVM no le quite memoria a la base de datos. |

### Cómo se desplegó

1. `deploy/azure/cloud-init.yaml` (en el primer arranque): instala Docker desde el repositorio oficial y crea el *swap*.
2. Las imágenes se construyen **en el equipo local** y se copian comprimidas por SSH (`docker save | gzip | ssh … docker load`). Así el servidor no compila.
3. En el servidor se ejecuta `docker compose -f docker-compose.yml -f docker-compose.azure.yml up -d --no-build`, que además de los tres servicios arranca **Caddy** para HTTPS (imagen oficial `caddy:2.11.7-alpine`; los certificados se guardan en el volumen `caddy-data`).

Para publicar una versión nueva basta, desde la raíz del repositorio y con Git Bash:

```bash
./deploy/azure/deploy.sh
```

### Apagar, encender y borrar

Con la [CLI de Azure](https://learn.microsoft.com/cli/azure/install-azure-cli) (`az login` antes del primer uso):

| Acción | Comando | Efecto |
|---|---|---|
| **Apagar** cuando no se use | `az vm deallocate -g rg-entidad-financiera -n vm-entidad-financiera` | Deja de cobrar la máquina; solo se pagan el disco y la IP (unos 6 USD/mes). La dirección y los datos se conservan. |
| **Encender** | `az vm start -g rg-entidad-financiera -n vm-entidad-financiera` | La aplicación arranca sola en 1 o 2 minutos (`restart: unless-stopped`). |
| Ver el estado | `az vm get-instance-view -g rg-entidad-financiera -n vm-entidad-financiera --query "instanceView.statuses[1].displayStatus" -o tsv` | `VM running` o `VM deallocated`. |
| **Borrar todo** | `az group delete --name rg-entidad-financiera --yes` | Elimina la máquina, el disco, la IP, la red y el firewall. No se puede deshacer. |
| Comprobar que no quedó nada | `az group exists --name rg-entidad-financiera` → `false` y `az resource list -o table` | Confirma que no quedan recursos que consuman crédito. |

> **Importante:** apagar la máquina desde dentro de Ubuntu (`shutdown`) **no** detiene el cobro. Hay que *desasignarla* (`deallocate`), por la CLI o con el botón **Detener** del portal.

En el portal (https://portal.azure.com) lo mismo se hace en **Máquinas virtuales → vm-entidad-financiera → Detener / Iniciar**, y el gasto se ve en **Cost Management → Análisis de costos**.
