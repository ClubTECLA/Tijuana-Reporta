package database

import "embed"

// Migrations son los archivos de internal/database/migrations, embebidos en
// el binario para que los tests puedan aplicarlos (con golang-migrate y la
// fuente iofs) sin depender del directorio desde el que corre `go test`.
//
//go:embed migrations/*.sql
var Migrations embed.FS
