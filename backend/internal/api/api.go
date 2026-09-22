package api

import (
	"context"
	"time"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/domain"
	uuid "github.com/google/uuid"
)

type ComentarioService interface {
	Crear(ctx context.Context, reporteID, userID uuid.UUID, texto string) (domain.Comentario, error)
}

// AuthService devuelve, junto con el usuario, el access token ya firmado y
// su tiempo de vida, para que el handler pueda armar el AuthResponse del
// contrato sin conocer nada sobre cómo se firma o valida el token.
type AuthService interface {
	Register(ctx context.Context, email, username, password string) (domain.Users, string, time.Duration, error)
	Login(ctx context.Context, email, password string) (domain.Users, string, time.Duration, error)
	GetUser(ctx context.Context, id uuid.UUID) (domain.Users, error)
}

type Services struct {
	Comentarios ComentarioService
	Auth        AuthService
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
