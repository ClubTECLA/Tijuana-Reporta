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

## Migraciones de base de datos

```bash
migrate -path backend/internal/database/migrations -database "$DATABASE_URL" up
migrate -path backend/internal/database/migrations -database "$DATABASE_URL" down 1
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