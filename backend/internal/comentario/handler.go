package comentario

import (
	"context"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/httpapi"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/httperr"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/middleware"
)

// Handler implementa las operaciones de comentarios del contrato; el
// servidor lo embebe junto con los de las demás funcionalidades.
type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

func toComentario(c ConAutor) httpapi.Comentario {
	return httpapi.Comentario{
		Comentario: c.Comentario,
		CreatedAt:  c.CreatedAt,
		Id:         c.ID,
		ReporteId:  c.ReporteID,
		RolName:    &c.RolName,
		UserId:     c.UserID,
		Username:   &c.Username,
	}
}

// CrearComentario crea un comentario para el reporte y usuario dados.
func (h *Handler) CrearComentario(ctx context.Context, request httpapi.CrearComentarioRequestObject) (httpapi.CrearComentarioResponseObject, error) {
	userID, ok := middleware.UserIDFromContext(ctx)
	if !ok {
		return nil, httperr.ErrNoAutenticado
	}

	c, err := h.svc.Crear(ctx, request.ReporteId, userID, request.Body.Comentario)
	if err != nil {
		return nil, err
	}

	return httpapi.CrearComentario201JSONResponse(toComentario(c)), nil
}
