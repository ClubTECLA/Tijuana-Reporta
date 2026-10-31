package domain

import "github.com/google/uuid"

// Archivo escrito a mano: convive con el código generado por sqlc, que solo
// reescribe models.go, querier.go, db.go y los *.sql.go.

// RolCiudadano es el rol por defecto de los usuarios registrados (tabla roles).
const RolCiudadano = "ciudadano"

// PuedeGestionar reporta si el rol puede gestionar reportes: crearlos como
// oficiales y cambiarles el estado. Puede cualquier rol menos ciudadano. Se
// compara contra ciudadano (y no contra una lista de roles permitidos) para
// que un rol nuevo en la tabla roles quede permitido sin tocar este código.
// Un rol vacío (token anterior al claim "rol") cuenta como ciudadano.
func PuedeGestionar(rol string) bool {
	return rol != "" && rol != RolCiudadano
}

// UserWithRol es un usuario junto con el nombre de su rol, ya resuelto contra
// la tabla roles.
type UserWithRol struct {
	ID       uuid.UUID
	Email    *string
	Username string
	RolName  string
}
