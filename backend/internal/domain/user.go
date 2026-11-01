package domain

import "github.com/google/uuid"

// UserWithRol es un usuario junto con el nombre de su rol, ya resuelto contra
// la tabla roles.
type UserWithRol struct {
	ID       uuid.UUID
	Email    *string
	Username string
	RolName  string
}
