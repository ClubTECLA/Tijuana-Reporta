package service

import (
	"context"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/domain"
	"github.com/google/uuid"
)

// ComentarioStore es el subconjunto de *database.Store que este servicio usa.
type ComentarioStore interface {
	CreateComentario(ctx context.Context, arg domain.CreateComentarioParams) (domain.Comentario, error)
}

type ComentarioService struct {
	store ComentarioStore
}

// NewComentarioService crea un servicio de comentarios con la store dada.
func NewComentarioService(store ComentarioStore) *ComentarioService {
	return &ComentarioService{store: store}
}

// Crear crea un comentario para el reporte y usuario dados.
func (s *ComentarioService) Crear(ctx context.Context, reporteID, userID uuid.UUID, texto string) (domain.Comentario, error) {
	return s.store.CreateComentario(ctx, domain.CreateComentarioParams{
		ReporteID:  reporteID,
		UserID:     userID,
		Comentario: texto,
	})
}
