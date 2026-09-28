package api

import (
	"context"
	"time"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/domain"
	uuid "github.com/google/uuid"
)

// ComentarioService es la interfaz que el handler de comentarios necesita del
// servicio.
type ComentarioService interface {
	Crear(ctx context.Context, reporteID, userID uuid.UUID, texto string) (domain.Comentario, error)
}

// ReporteService es la interfaz que el handler de reportes necesita del
// servicio.
type ReporteService interface {
	Crear(ctx context.Context, userID uuid.UUID, incidenteID int, latitude, longitude float64, imagePath *string) (domain.Reporte, error)
}

// AuthService devuelve, junto con el usuario, el access token ya firmado y
// su tiempo de vida, para que el handler pueda armar el AuthResponse del
// contrato sin conocer nada sobre cómo se firma o valida el token.
type AuthService interface {
	Register(ctx context.Context, email, username, password string) (domain.User, string, time.Duration, error)
	Login(ctx context.Context, email, password string) (domain.User, string, time.Duration, error)
	GetUser(ctx context.Context, id uuid.UUID) (domain.UserWithRol, error)
}

// Services agrupa los servicios que el servidor expone a la API.
type Services struct {
	Comentarios ComentarioService
	Reportes    ReporteService
	Auth        AuthService
}

// Server implementa la interfaz que oapi-codegen genera a partir de
// shared/openapi/openapi.yaml.
//
// Cada handler recibe la petición ya parseada y validada, y devuelve uno de los
// tipos de respuesta que el contrato declara para esa operación.
//
// La lógica de negocio vive en internal/service; aquí solo se traduce entre
// HTTP y dominio.
type Server struct {
	services Services
}

// Assertion en tiempo de compilación: si el contrato gana un endpoint y aquí no
// se implementa, el build falla en vez de devolver un 404 en runtime.
var _ StrictServerInterface = (*Server)(nil)

// NewServer crea un servidor con los servicios dados.
func NewServer(services Services) *Server {
	return &Server{services: services}
}
