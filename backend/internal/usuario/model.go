package usuario

import "github.com/google/uuid"

// ConRol es un usuario junto con el nombre de su rol, ya resuelto contra
// la tabla roles.
type ConRol struct {
	ID       uuid.UUID
	Email    *string
	Username string
	RolName  string
}
