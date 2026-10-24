FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app

# --- Etapa 1: instalar dependencias ---
FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY shared/package.json ./shared/package.json
COPY frontend-web/package.json ./frontend-web/package.json
RUN pnpm install --filter @tijuana-reporta/frontend-web... --frozen-lockfile

# --- Etapa 2: build ---
FROM base AS build
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
COPY --from=deps /app /app
COPY shared ./shared
COPY frontend-web ./frontend-web
RUN pnpm --filter @tijuana-reporta/frontend-web build

# --- Etapa 3: imagen final ---
FROM nginx:alpine
COPY --from=build /app/frontend-web/dist /usr/share/nginx/html
EXPOSE 80