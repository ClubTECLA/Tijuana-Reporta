# Tijuana Reporta

Plataforma para reportar incidencias en Tijuana. Monorepo con backend en Go, frontend web en React + Vite, y app móvil en Expo.

## Estructura del proyecto

```
tijuana-reporta/
├── backend/          # API en Go
├── frontend-web/      # App web en React + Vite (pnpm workspace)
├── frontend-mobile/   # App móvil en Expo / React Native
├── shared/            # Código compartido (tipos, contratos de API)
├── nginx/              # Proxy reverso para el entorno de Docker
├── docker-compose.yml
└── .env.example
```

## Requisitos previos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Go 1.23+](https://go.dev/dl/) (para desarrollar el backend fuera de Docker)
- [Node.js 20+](https://nodejs.org/) y [pnpm](https://pnpm.io/installation) (para el frontend web)
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (solo si vas a trabajar en `frontend-mobile`)

## Configuración inicial

1. Clona el repo:
   ```bash
   git clone https://github.com/ClubTECLA/Tijuana-Reporta.git
   cd tijuana-reporta
   ```

2. Copia el archivo de variables de entorno de ejemplo y llena tus propios valores:
   ```bash
   cp .env.example .env
   ```
   Como mínimo, cambia `POSTGRES_PASSWORD` y `JWT_SECRET` por cualquier valor (no importa cuál, mientras `POSTGRES_PASSWORD` y el password dentro de `DATABASE_URL` sean **el mismo valor**).

## Cómo levantar el proyecto

### Opción A: Todo en Docker (para probar el stack completo, como en producción)

```bash
docker compose up --build
```

Esto levanta Postgres, el backend, el frontend compilado, y nginx como proxy reverso. Una vez arriba:

- Frontend: [http://localhost/](http://localhost/)
- Backend (a través de nginx): [http://localhost/api/health](http://localhost/api/health)

Para parar todo:
```bash
docker compose down
```

> Nota: cualquier cambio en código de Go, React, o en un `Dockerfile` requiere volver a correr con `--build` para que se refleje. Cambios en `.env` o `docker-compose.yml` solo requieren `docker compose down && docker compose up`.

### Opción B: Desarrollo del día a día (recomendada mientras programas)

Correr todo en Docker cada vez que cambias una línea de frontend es lento, así que para desarrollo activo:

1. Levanta solo Postgres y el backend:
   ```bash
   docker compose up postgres backend
   ```
   Esto usa `docker-compose.override.yml` (creado por ti localmente, no está en el repo) para publicar el puerto 8080 del backend hacia tu máquina. Ejemplo de `docker-compose.override.yml`:
   ```yaml
   services:
     backend:
       ports:
         - "8080:8080"
   ```

2. En otra terminal, corre el frontend con hot reload:
   ```bash
   cd frontend-web
   pnpm install
   pnpm dev
   ```
   Crea un `frontend-web/.env.local` (ignorado por git) apuntando directo al backend, sin pasar por nginx:
   ```
   VITE_API_URL=http://localhost:8080/v1
   ```

### Opción C: Desarrollo móvil (Expo)

La app móvil **no corre en Docker** — Expo necesita comunicarse directamente con tu emulador o dispositivo físico. El backend sí puede estar en Docker.

1. Levanta Postgres y el backend igual que en la Opción B:
   ```bash
   docker compose up postgres backend
   ```

2. Crea `frontend-mobile/.env.local` (ignorado por git) con la URL de tu API. **El valor depende de dónde corras la app:**

   | Dónde corres la app | Qué host usar |
   |---|---|
   | Dispositivo físico (Expo Go) | La IP de tu PC en la red local, ej. `192.168.1.45` |
   | Emulador de Android | `10.0.2.2` |
   | Simulador de iOS | `localhost` |

   Ejemplo para dispositivo físico:
   ```
   EXPO_PUBLIC_API_URL=http://192.168.1.45:8080/v1
   ```

   > Expo usa el prefijo `EXPO_PUBLIC_` (no `VITE_`) para exponer variables al código del cliente. En el código se leen con `process.env.EXPO_PUBLIC_API_URL`.

3. Para encontrar tu IP local:
   - **Windows:** `ipconfig` → busca "Dirección IPv4" en tu adaptador de Wi-Fi
   - **macOS / Linux:** `ifconfig` o `ip addr`

4. Arranca Expo:
   ```bash
   cd frontend-mobile
   pnpm install
   pnpm start
   ```

**Problemas comunes:**

- *La app no conecta con la API desde el celular:* tu PC y tu teléfono deben estar en la **misma red Wi-Fi**. Además, el Firewall de Windows a veces bloquea conexiones entrantes al puerto 8080 — puede que tengas que permitirlo manualmente.
- *Funciona en el emulador pero no en el celular (o al revés):* revisa que estés usando el host correcto según la tabla de arriba. Es el error más común.
- *Cambiaste el `.env.local` y no se refleja:* reinicia el servidor de Expo por completo (Ctrl+C y `pnpm start` de nuevo); las variables `EXPO_PUBLIC_` se leen al arrancar.

## Cómo trabajar en el proyecto

Para evitar pisarse el trabajo entre compañeros y minimizar conflictos al fusionar cambios, sigue este flujo cada vez que vayas a trabajar en algo:

1. **Antes de empezar a trabajar**, párate en la rama principal y trae los últimos cambios:
   ```bash
   git checkout main
   git pull
   ```

2. **Crea una rama nueva** para lo que vayas a trabajar, con un nombre descriptivo (ej. `feature/login-google`, `fix/conexion-postgres`):
   ```bash
   git checkout -b feature/nombre-de-tu-tarea
   ```

3. Trabaja normalmente y ve haciendo commits pequeños y descriptivos conforme avances:
   ```bash
   git add .
   git commit -m "Descripción clara de qué cambiaste"
   ```

4. **Antes de cada commit** (o al menos antes de subir tus cambios), trae los cambios más recientes de `main` a tu rama para detectar conflictos lo antes posible, no hasta el final:
   ```bash
   git checkout main
   git pull
   git checkout feature/nombre-de-tu-tarea
   git merge main
   ```
   Si hay conflictos, resuélvelos aquí, en tu rama — es mucho más fácil que resolverlos hasta que quieras fusionar a `main`.

5. **Sube tu rama** al repositorio remoto:
   ```bash
   git push -u origin feature/nombre-de-tu-tarea
   ```
   (Solo necesitas `-u origin nombre-rama` la primera vez que subes esa rama; después basta con `git push`.)

6. **Abre un Pull Request en GitHub** hacia `main`, describe brevemente qué hiciste, y pide revisión a un compañero antes de fusionar.

7. Una vez aprobado y fusionado el Pull Request, borra tu rama local (opcional, pero mantiene todo limpio):
   ```bash
   git checkout main
   git pull
   git branch -d feature/nombre-de-tu-tarea
   ```

## Migraciones de base de datos

```bash
migrate -path backend/internal/database/migrations -database "$DATABASE_URL" up
migrate -path backend/internal/database/migrations -database "$DATABASE_URL" down 1
```

`001_baseline` es todo el esquema con sus datos semilla en un solo `up`/`down`. Reemplaza a las migraciones 001–006 anteriores, que siguen en el historial de git.

**Versión.** Es el número del archivo (`001_baseline` = 1). `migrate` la guarda en la tabla `schema_migrations` de la propia base y en cada `up` aplica solo las migraciones con número mayor.

**Arranque con Docker.** El orden es `postgres → dbcheck → migrate → backend`. `dbcheck` lee la versión y frena todo si la base:

- tiene el esquema anterior (migraciones 001–006 sueltas) o tablas sin `schema_migrations`;
- quedó a medias (`dirty`);
- es más nueva que el código.

Si está vacía o en una versión menor pasa, y `migrate` la crea o la actualiza. Para recrearla: `docker compose down -v && docker compose up -d --build` (borra los datos).

**Agregar un cambio.** Crea `002_nombre.up.sql` y `002_nombre.down.sql` en `backend/internal/database/migrations/` y levanta el stack; no hay que tocar nada más. No edites `001_baseline` una vez desplegada.

**Verificar la base.**

```bash
# tests (los de integración levantan su propio Postgres y aplican la migración)
cd backend && go test -count=1 ./...

# levantar el stack aparte de tu base local (el puerto 5432 suele estar ocupado)
POSTGRES_PORT=5436 docker compose -p verif up -d --build postgres dbcheck migrate backend
docker compose -p verif logs dbcheck migrate

# ver la versión y la tabla de multimedia
docker compose -p verif exec postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT * FROM schema_migrations;" -c "\d multimedia"'

docker compose -p verif down -v
```

## Datos de prueba (seed) y consola de la base

Los datos de prueba están en `backend/seeds/`, **fuera** de `migrations/` a propósito: `migrate up` corre también en producción, y el seed es solo para desarrollo (nunca lo apliques en producción).

| Archivo | Para qué sirve |
|---|---|
| `backend/seeds/dev.sql` | Carga usuarios, reportes, ubicaciones, tags y comentarios de prueba |
| `backend/seeds/check.sql` | Comprueba que el seed quedó completo (solo lee, no modifica nada) |

El `docker-compose.yml` monta esa carpeta en `/seeds` dentro del contenedor de Postgres. Los comandos están en el `package.json` de la raíz y se corren desde la raíz del repo:

| Comando | Qué hace |
|---|---|
| `pnpm db:seed` | Carga los datos de prueba. Requiere las migraciones aplicadas y se puede correr varias veces sin duplicar nada |
| `pnpm db:seed:check` | Compara los conteos esperados contra los actuales (cada tabla debe decir `OK`) y muestra un resumen por reporte y por usuario |
| `pnpm db:psql` | Abre una consola `psql` dentro de la base del contenedor |

> Los scripts usan el usuario `tijuana` y la base `tijuana_reporta` (los valores de `.env.example`). Si cambiaste `POSTGRES_USER` o `POSTGRES_DB` en tu `.env`, ajústalos en los scripts del `package.json`.

**Flujo normal:**

```bash
docker compose up -d     # levanta todo y aplica las migraciones solo
pnpm db:seed             # carga los datos de prueba
pnpm db:seed:check       # confirma que quedó completo
```

**Volver a empezar con la base limpia:**

```bash
docker compose down -v   # borra el volumen (y todos los datos)
docker compose up -d
pnpm db:seed
```

Si ya habías cargado una versión anterior del seed, usa esto para no mezclar datos viejos con los nuevos.

### Qué contiene el seed

- **8 usuarios**, todos con rol `ciudadano`, password `test1234` y sin proveedor de login (no hay forma de generar un token de Google en local): `ana_garcia`, `luis_ramirez`, `mariana_lopez`, `carlos_hdz`, `sofia_martinez`, `jorge_torres`, `valeria_cruz` y `diego_flores`. Este último queda en estado `Pendiente` y sin actividad, para probar usuarios sin verificar.
- **12 reportes** que cubren los 7 tipos de incidente y los 5 estados, con entre 1 y 4 ubicaciones cada uno. `puntos_origen` no se inserta a mano: lo calcula el trigger a partir de `location`.
- **28 tags** (4 por tipo de incidente), **33 asignaciones de tags** a reportes y **15 comentarios**.
- **UUIDs fijos** para poder referenciarlos: usuarios `c1000000-0000-0000-0000-00000000000N` (N de 1 a 8) y reportes `d0000000-0000-0000-0000-0000000000NN` (NN de 01 a 12).

**Probar endpoints protegidos sin login real:** firma un JWT con algoritmo HS256 usando tu `JWT_SECRET` de desarrollo (nunca el de producción), con el claim `sub` igual al UUID de un usuario del seed, por ejemplo `c1000000-0000-0000-0000-000000000001` (`ana_garcia`). Mándalo como `Authorization: Bearer <token>`; es lo que lee `middleware.Auth`.

### Consola de la base (`pnpm db:psql`)

Dentro de `psql`, los comandos que empiezan con `\` son de la consola y no llevan `;`. Las consultas SQL sí terminan en `;`.

| Quiero... | Comando |
|---|---|
| Listar las tablas | `\dt` |
| Ver columnas, índices y relaciones de una tabla | `\d users` (cambia `users` por la tabla) |
| Ver los valores posibles de un enum | `\dT+ estado` |
| Ver las extensiones instaladas (PostGIS) | `\dx` |
| Listar las bases de datos | `\l` |
| Ver filas anchas en vertical | `\x` (otra vez `\x` lo desactiva) |
| Quitar el paginador si la salida se traba | `\pset pager off` |
| Salir | `\q` |

Consultas útiles para revisar el seed:

| Quiero ver... | Consulta |
|---|---|
| Los usuarios y su estado | `SELECT username, state FROM users;` |
| Cuántos reportes hay | `SELECT count(*) FROM reporte;` |
| Las primeras filas de cualquier tabla | `SELECT * FROM comentarios LIMIT 5;` |
| Reportes con su tipo de incidente | `SELECT r.id, i.nombre, r.estado_actual FROM reporte r JOIN incidentes i ON i.id = r.incidente_id;` |
| Comentarios con quién los escribió | `SELECT c.comentario, u.username FROM comentarios c JOIN users u ON u.id = c.user_id;` |
| El centro de cada reporte como punto | `SELECT reporte_id, ST_AsText(geom) FROM puntos_origen;` |
| La versión de migración aplicada | `SELECT * FROM schema_migrations;` |

También puedes conectar un cliente gráfico (DBeaver, pgAdmin, TablePlus) a `localhost:5432` (o el valor de tu `POSTGRES_PORT`) con el usuario y la contraseña de tu `.env`.

**Problemas comunes:**

- *`database "..." does not exist`:* el nombre que pasa `-d` en el script no coincide con `POSTGRES_DB` de tu `.env`. Revisa que esté bien escrito en el `package.json` (por defecto, `tijuana_reporta`).
- *El seed dice que una tabla no existe (`relation ... does not exist`):* `migrate` todavía no termina. Corre `docker compose ps -a`; `migrate` debe aparecer como `Exited (0)`.
- *`dbcheck` falla con `set: Illegal option -`:* el `.sh` tiene saltos de línea de Windows (CRLF). Conviértelo a LF; un `.gitattributes` con `*.sh text eol=lf` evita que vuelva a pasar.

## Generación de código (OpenAPI / SQL)

```bash
oapi-codegen -config backend/oapi-codegen-config.yaml shared/openapi/openapi.yaml
sqlc generate
```

## Tests

```bash
cd backend
go test ./... -v
```

## Notas sobre rutas de la API

Las rutas del backend se registran **sin** el prefijo `/api` (por ejemplo `/v1/reportes`), porque nginx quita ese prefijo antes de reenviar la petición. El frontend sí debe usar el prefijo completo (`/api/v1/reportes`) para que nginx sepa a dónde enrutarlo.

## Variables de entorno

Ver `.env.example` para la lista completa. Algunas notas:

- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`: necesarias solo si vas a probar login con Google.
- `VITE_MAPLIBRE_STYLE_URL`: necesaria solo si vas a probar el mapa.
- `JWT_SECRET`: cualquier valor sirve en desarrollo local.