package domain

import (
	"time"

	"github.com/google/uuid"
)

// Archivo escrito a mano: convive con el código generado por sqlc, que solo
// reescribe models.go, querier.go, db.go y los *.sql.go.

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
