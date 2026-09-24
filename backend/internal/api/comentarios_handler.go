package api

import (
	"context"
	"errors"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/middleware"
)

// CrearComentario crea un comentario para el reporte y usuario dados.
func (s *Server) CrearComentario(ctx context.Context, request CrearComentarioRequestObject) (CrearComentarioResponseObject, error) {
	userID, ok := middleware.UserIDFromContext(ctx)
	if !ok {
		return nil, errors.New("userID not found in context")
	}

	c, err := s.services.Comentarios.Crear(ctx, request.ReporteId, userID, request.Body.Comentario)
	if err != nil {
		return nil, err
	}

	return CrearComentario201JSONResponse{
		Id:         c.ID,
		ReporteId:  c.ReporteID,
		UserId:     c.UserID,
		Comentario: c.Comentario,
		CreatedAt:  c.CreatedAt,
	}, nil
}
