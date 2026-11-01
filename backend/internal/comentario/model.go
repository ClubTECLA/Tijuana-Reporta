package comentario

import (
	"time"

	"github.com/google/uuid"
)

// ConAutor es un comentario junto con el username y el nombre del
// rol de su autor, ya resueltos contra las tablas users y roles.
type ConAutor struct {
	ID         int
	ReporteID  uuid.UUID
	UserID     uuid.UUID
	Comentario string
	CreatedAt  time.Time
	Username   string
	RolName    string
}
