package api

import (
	"context"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/domain"
	uuid "github.com/google/uuid"
)

type ComentarioService interface {
	Crear(ctx context.Context, reporteID, userID uuid.UUID, texto string) (domain.Comentario, error)
}

type Services struct {
	Comentarios ComentarioService
}

// Server implementa StrictServerInterface, la interfaz que oapi-codegen genera
// a partir de shared/openapi/openapi.yaml (ver generated.go, no editar a mano).
//
// Cada handler recibe la petición ya parseada y validada, y devuelve uno de los
// tipos de respuesta que el contrato declara para esa operación. La lógica de
// negocio vive en internal/service; aquí solo se traduce entre HTTP y dominio.
type Server struct {
	services Services
}

// Assertion en tiempo de compilación: si el contrato gana un endpoint y aquí no
// se implementa, el build falla en vez de devolver un 404 en runtime.
var _ StrictServerInterface = (*Server)(nil)

func NewServer(services Services) *Server {
	return &Server{services: services}
}
