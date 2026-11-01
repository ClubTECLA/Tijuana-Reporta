package domain

import (
	"time"

	"github.com/google/uuid"
)

// ComentarioConAutor es un comentario junto con el username y el nombre del
// rol de su autor, ya resueltos contra las tablas users y roles.
type ComentarioConAutor struct {
	ID         int
	ReporteID  uuid.UUID
	UserID     uuid.UUID
	Comentario string
	CreatedAt  time.Time
	Username   string
	RolName    string
}
