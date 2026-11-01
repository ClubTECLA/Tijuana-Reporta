package httpapi

import (
	"context"
	"io"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/db/sqlc"
	uuid "github.com/google/uuid"
)

// MultimediaService es la interfaz que el handler de multimedia necesita del
// servicio.
type MultimediaService interface {
	Subir(ctx context.Context, reporteID, userID uuid.UUID, archivo io.Reader) (sqlc.Multimedia, error)
}

// Services agrupa los servicios que el servidor expone a la API.
type Services struct {
	Multimedia MultimediaService
}

// Server implementa las operaciones del contrato que todavía no tienen
// paquete propio; internal/server lo embebe junto con los Handler de cada
// funcionalidad para completar StrictServerInterface.
//
// Cada handler recibe la petición ya parseada y validada, y devuelve uno de los
// tipos de respuesta que el contrato declara para esa operación.
//
// La lógica de negocio vive en internal/service; aquí solo se traduce entre
// HTTP y dominio.
type Server struct {
	services Services
}

// NewServer crea un servidor con los servicios dados.
func NewServer(services Services) *Server {
	return &Server{services: services}
}
