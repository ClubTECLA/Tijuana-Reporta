package api

import (
	"context"
	"errors"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/domain"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/middleware"
	uuid "github.com/google/uuid"
)

type ComentarioService interface {
	Crear(ctx context.Context, reporteID, userID uuid.UUID, texto string) (domain.Comentario, error)
}

// Server implementa StrictServerInterface, la interfaz que oapi-codegen genera
// a partir de shared/openapi/openapi.yaml (ver generated.go, no editar a mano).
//
// Cada handler recibe la petición ya parseada y validada, y devuelve uno de los
// tipos de respuesta que el contrato declara para esa operación. La lógica de
// negocio vive en internal/service; aquí solo se traduce entre HTTP y dominio.
type Server struct {
	comentarios ComentarioService
}

// Assertion en tiempo de compilación: si el contrato gana un endpoint y aquí no
// se implementa, el build falla en vez de devolver un 404 en runtime.
var _ StrictServerInterface = (*Server)(nil)

func NewServer(comentarios ComentarioService) *Server {
	return &Server{comentarios: comentarios}
}

func (s *Server) CrearComentario(ctx context.Context, request CrearComentarioRequestObject) (CrearComentarioResponseObject, error) {
	userID, ok := middleware.UserIDFromContext(ctx)
	if !ok {
		return nil, errors.New("userID not found in context")
	}

	c, err := s.comentarios.Crear(ctx, request.ReporteId, userID, request.Body.Comentario)
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
