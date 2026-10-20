#!/bin/sh
# Corre antes de migrate y frena el arranque si la base no se puede llevar a la
# versión del código. La versión esperada es la de la última migración de la
# carpeta, así que al agregar una no hay que tocar nada aquí.

set -eu

MIGRATIONS_DIR="${MIGRATIONS_DIR:-/migrations}"

q() {
    psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -tAq -c "$1"
}

fail() {
    echo "dbcheck: $1" >&2
    echo "dbcheck: recrea la base con: docker compose down -v && docker compose up -d --build" >&2
    exit 1
}

esperada=$(ls "$MIGRATIONS_DIR" | sed -n 's/^0*\([0-9][0-9]*\)_.*\.up\.sql$/\1/p' | sort -n | tail -1)
[ -n "$esperada" ] || fail "no hay migraciones en $MIGRATIONS_DIR"

# Esquema anterior (migraciones 001-006 sueltas): no es compatible con el baseline.
if [ "$(q "SELECT to_regclass('public.migration_005_seed_incidentes') IS NOT NULL")" = "t" ]; then
    fail "la base tiene el esquema anterior (migraciones 001-006 sueltas)"
fi

tablas=$(q "SELECT count(*) FROM pg_tables WHERE schemaname = 'public' AND tablename <> 'schema_migrations'")
version=""
if [ "$(q "SELECT to_regclass('public.schema_migrations') IS NOT NULL")" = "t" ]; then
    fila=$(q "SELECT version || ',' || dirty::int FROM schema_migrations LIMIT 1")
    version="${fila%,*}"
    sucia="${fila#*,}"
fi

if [ -z "$version" ]; then
    [ "$tablas" = "0" ] || fail "la base tiene tablas pero no tiene versión registrada (schema_migrations)"
    echo "dbcheck: base vacía; migrate la creará hasta la versión $esperada"
    exit 0
fi

[ "$sucia" = "0" ] || fail "la base está en la versión $version con una migración a medias (dirty)"
[ "$version" -le "$esperada" ] || fail "la base está en la versión $version, más nueva que la del código ($esperada)"

echo "dbcheck: base en la versión $version; el código espera la $esperada"
