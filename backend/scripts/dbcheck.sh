#!/bin/sh
# Corre antes de migrate y frena el arranque si la base no se puede llevar a la
# versiÃ³n del cÃ³digo. La versiÃ³n esperada es la de la Ãºltima migraciÃ³n de la
# carpeta, asÃ­ que al agregar una no hay que tocar nada aquÃ­.

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
    [ "$tablas" = "0" ] || fail "la base tiene tablas pero no tiene versiÃ³n registrada (schema_migrations)"
    echo "dbcheck: base vacÃ­a; migrate la crearÃ¡ hasta la versiÃ³n $esperada"
    exit 0
fi

[ "$sucia" = "0" ] || fail "la base estÃ¡ en la versiÃ³n $version con una migraciÃ³n a medias (dirty)"
[ "$version" -le "$esperada" ] || fail "la base estÃ¡ en la versiÃ³n $version, mÃ¡s nueva que la del cÃ³digo ($esperada)"

echo "dbcheck: base en la versiÃ³n $version; el cÃ³digo espera la $esperada"
