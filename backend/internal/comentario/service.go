package comentario

import (
	"context"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/db"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/db/sqlc"
	"github.com/google/uuid"
)

// store es lo que el servicio necesita de Store; los tests lo cumplen con un
// falso en memoria.
type store interface {
	CreateComentario(ctx context.Context, arg sqlc.CreateComentarioParams) (sqlc.CreateComentarioRow, error)
}

type Service struct {
	store store
}

// NewService crea un servicio de comentarios con la store dada.
func NewService(store store) *Service {
	return &Service{store: store}
}

// Crear crea un comentario para el reporte y usuario dados y lo devuelve con
// el username y el rol de su autor.
func (s *Service) Crear(ctx context.Context, reporteID, userID uuid.UUID, texto string) (ConAutor, error) {
	row, err := s.store.CreateComentario(ctx, sqlc.CreateComentarioParams{
		ReporteID:  reporteID,
		UserID:     userID,
		Comentario: texto,
	})

	if db.IsForeignKeyViolation(err, "comentarios_reporte_id_fkey") {
		return ConAutor{}, ErrReporteNotFound
	}

	if err != nil {
		return ConAutor{}, err
	}

	return ConAutor{
		ID:         row.ID,
		ReporteID:  row.ReporteID,
		UserID:     row.UserID,
		Comentario: row.Comentario,
		CreatedAt:  row.CreatedAt,
		Username:   row.Username,
		RolName:    row.RolName,
	}, nil
}
