package service

import (
	"context"
	"strings"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/domain"
	"github.com/google/uuid"
)

type ComentarioRepository interface {
	Crear(ctx context.Context, reporteID, userID uuid.UUID, texto string) (domain.Comentario, error)
}

type ComentarioService struct {
	repo ComentarioRepository
}

func NewComentarioService(repo ComentarioRepository) *ComentarioService {
	return &ComentarioService{repo: repo}
}

func (s *ComentarioService) Crear(ctx context.Context, reporteID, userID uuid.UUID, texto string) (domain.Comentario, error) {
	texto = strings.TrimSpace(texto)
	// Business rules go here (trimming, word filters, rate limits, ...)
	return s.repo.Crear(ctx, reporteID, userID, texto)
}
