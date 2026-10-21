package api

import (
	"context"
	"errors"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/domain"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/middleware"
)

func toComentario(comment any) Comentario {
	switch c := comment.(type) {
	case domain.ComentarioConAutor:
		return Comentario{
			Comentario: c.Comentario,
			CreatedAt:  c.CreatedAt,
			Id:         c.ID,
			ReporteId:  c.ReporteID,
			RolName:    &c.RolName,
			UserId:     c.UserID,
			Username:   &c.Username,
		}
	case domain.Comentario:
		return Comentario{
			Comentario: c.Comentario,
			CreatedAt:  c.CreatedAt,
			Id:         c.ID,
			ReporteId:  c.ReporteID,
			UserId:     c.UserID,
		}
	}
	return Comentario{}
}

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

	return CrearComentario201JSONResponse(toComentario(c)), nil
}
