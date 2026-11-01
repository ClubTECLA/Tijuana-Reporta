# Tests del backend

Hay dos tipos de tests:

- **Unitarios**, junto al código de cada funcionalidad (`internal/<funcionalidad>/*_test.go`).
  Prueban el servicio con un falso en memoria del store, sin base de datos.
- **De integración**, en `internal/server/`. Levantan el router real contra un Postgres
  desechable y ejercen la API por HTTP.

## Tests unitarios del servicio

Cada servicio depende de una interfaz `store` (sin exportar) que declara solo los métodos
que usa, con las firmas que **sqlc** genera en `internal/db/sqlc`
(`CreateComentario(ctx, sqlc.CreateComentarioParams)`, etc.). El `Store` de la
funcionalidad la cumple sin adaptadores, y los tests la cumplen con un falso en memoria.
Ver `internal/comentario/service_test.go` (el más corto) y
`internal/reporte/service_test.go` como referencia.

### Convenciones

- Un archivo `_test.go` por archivo probado (`service.go` -> `service_test.go`,
  `auth.go` -> `auth_test.go`).
- Mismo paquete que el código (`package reporte`), no un paquete `reporte_test` externo:
  así el falso puede cumplir la interfaz `store` sin exportarla.
- Nombre de la función: `TestTipo_Comportamiento` (p. ej. `TestAuthService_RegisterAndLogin`).
- Un falso (fake) mínimo que implemente la interfaz `store`, en vez de un mock generado.
  Alcanza con un `map` o un slice en memoria.
- El falso devuelve los mismos errores que devolvería Postgres (`pgx.ErrNoRows`, un
  `*pgconn.PgError` con código `23505`), para que el test ejerza la traducción a los
  errores de la funcionalidad que hace el servicio (con `db.IsNotFound`,
  `db.IsUniqueViolation`, …).
- Si agregas un método a la interfaz `store`, impleméntalo también en el falso; si no, el
  paquete de tests no compila.
- Mensajes de error con el formato `Func() = got, want want`, para que quede claro qué
  falló sin tener que leer el código del test.

## Tests de integración

`internal/server/testdb_test.go` levanta una sola vez por corrida un contenedor
`postgis/postgis:16-3.5` con [testcontainers](https://golang.testcontainers.org/), le
aplica las migraciones de `internal/db/migrations` y lo borra al terminar. Solo hace falta
tener Docker corriendo; **sin Docker, estos tests se saltan** (en verde), así que revisa
que no digan `SKIP` antes de dar algo por probado.

`newTestClient` arma el router igual que `server.New`, pero con un falso del servicio
multimedia. Si agregas una funcionalidad, agrégala también ahí.

Si el contenedor auxiliar de testcontainers (Ryuk) no arranca a tiempo en tu máquina, el
primer test falla con `reaper: ... context deadline exceeded`. Se puede apagar:

```sh
TESTCONTAINERS_RYUK_DISABLED=true go test ./...
```

## Comandos útiles

```sh
go test ./...                                   # toda la suite
go test ./internal/reporte/... -v               # una funcionalidad, con detalle
go test -run TestAuthService ./internal/usuario/  # un test puntual
go test ./internal/server/ -v                   # solo los de integración
```

## Referencias

- [Paquete `testing`](https://pkg.go.dev/testing) — documentación oficial.
- [Add a test (Go tutorial)](https://go.dev/doc/tutorial/add-a-test) — introducción rápida.
- [Table-driven tests](https://go.dev/wiki/TableDrivenTests) — patrón recomendado cuando
  hay varios casos para el mismo comportamiento.
- [Subtests y sub-benchmarks](https://go.dev/blog/subtests) — uso de `t.Run` para agrupar
  casos relacionados.
- [Learn Go with Tests](https://quii.gitbook.io/learn-go-with-tests/) — guía comunitaria
  con ejemplos extensos de TDD en Go.
