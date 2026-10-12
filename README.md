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