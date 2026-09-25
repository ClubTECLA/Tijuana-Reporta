package domain

import "github.com/google/uuid"

// Archivo escrito a mano: convive con el código generado por sqlc, que solo
// reescribe models.go, querier.go, db.go y los *.sql.go.

// UserWithRol es un usuario junto con el nombre de su rol, ya resuelto contra
// la tabla roles.
type UserWithRol struct {
	ID       uuid.UUID
	Email    *string
	Username string
	RolName  string
}
