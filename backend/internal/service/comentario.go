package service

import (
	"context"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/domain"
	"github.com/google/uuid"
)

// ComentarioStore es el subconjunto de *database.Store que este servicio usa.
type ComentarioStore interface {
	CreateComentario(ctx context.Context, arg domain.CreateComentarioParams) (domain.CreateComentarioRow, error)
}

type ComentarioService struct {
	store ComentarioStore
}

// NewComentarioService crea un servicio de comentarios con la store dada.
func NewComentarioService(store ComentarioStore) *ComentarioService {
	return &ComentarioService{store: store}
}

// Crear crea un comentario para el reporte y usuario dados y lo devuelve con
// el username y el rol de su autor.
func (s *ComentarioService) Crear(ctx context.Context, reporteID, userID uuid.UUID, texto string) (domain.ComentarioConAutor, error) {
	row, err := s.store.CreateComentario(ctx, domain.CreateComentarioParams{
		ReporteID:  reporteID,
		UserID:     userID,
		Comentario: texto,
	})

	if domain.IsForeignKeyViolation(err, "comentarios_reporte_id_fkey") {
		return domain.ComentarioConAutor{}, domain.ErrReporteNotFound
	}

	if err != nil {
		return domain.ComentarioConAutor{}, err
	}

	return domain.ComentarioConAutor{
		ID:         row.ID,
		ReporteID:  row.ReporteID,
		UserID:     row.UserID,
		Comentario: row.Comentario,
		CreatedAt:  row.CreatedAt,
		Username:   row.Username,
		RolName:    row.RolName,
	}, nil
}
