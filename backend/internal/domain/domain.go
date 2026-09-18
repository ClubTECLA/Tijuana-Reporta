package domain

import (
	"time"

	"github.com/google/uuid"
)

type Comentario struct {
	ID         int
	ReporteID  uuid.UUID
	UserID     uuid.UUID
	Comentario string
	CreatedAt  time.Time
}
