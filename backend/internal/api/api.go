package api

import (
	"context"
	"errors"
)

// Server implementa StrictServerInterface, la interfaz que oapi-codegen genera
// a partir de shared/openapi/openapi.yaml (ver generated.go, no editar a mano).
//
// Cada handler recibe la petición ya parseada y validada, y devuelve uno de los
// tipos de respuesta que el contrato declara para esa operación. La lógica de
// negocio vive en internal/service; aquí solo se traduce entre HTTP y dominio.
type Server struct{}

// Assertion en tiempo de compilación: si el contrato gana un endpoint y aquí no
// se implementa, el build falla en vez de devolver un 404 en runtime.
var _ StrictServerInterface = (*Server)(nil)

func NewServer() *Server {
	return &Server{}
}

var errNoImplementado = errors.New("endpoint no implementado todavía")

func (s *Server) CrearComentario(ctx context.Context, request CrearComentarioRequestObject) (CrearComentarioResponseObject, error) {
	// request.ReporteId es uuid.UUID y request.Body ya viene deserializado.
	return nil, errNoImplementado
}
