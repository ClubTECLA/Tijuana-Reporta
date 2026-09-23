# Tests en `internal/service`

Los servicios dependen de interfaces (`UserRepository`, `ComentarioRepository`), no de
`*pgxpool.Pool` directamente. Eso permite probar la lógica de negocio con un falso en
memoria, sin necesidad de una base de datos real. Ver `auth_test.go` y
`comentario_test.go` como referencia.

## Convenciones

- Un archivo `_test.go` por archivo de servicio (`auth.go` -> `auth_test.go`).
- Mismo paquete (`package service`), no un paquete `service_test` externo, salvo que se
  necesite evitar un ciclo de imports.
- Nombre de la función: `TestTipo_Comportamiento` (p. ej. `TestAuthService_RegisterAndLogin`).
- Un falso(fake) mínimo que implemente la interfaz del repositorio correspondiente, en vez de un
  mock generado. Alcanza con un `map` o un slice en memoria.
- Mensajes de error con el formato `Func() = got, want want`, para que quede claro qué
  falló sin tener que leer el código del test.

## Comandos útiles

```sh
go test ./...              # toda la suite
go test ./internal/service/... -v   # solo este paquete, con detalle
go test -run TestAuthService ./internal/service/...  # un test puntual
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
