package api

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Server implementa StrictServerInterface, la interfaz que oapi-codegen genera
// a partir de shared/openapi/openapi.yaml (ver generated.go, no editar a mano).
//
// Cada handler recibe la petición ya parseada y validada, y devuelve uno de los
// tipos de respuesta que el contrato declara para esa operación. La lógica de
// negocio vive en internal/service; aquí solo se traduce entre HTTP y dominio.
type Server struct {
	DB *pgxpool.Pool
}

// Assertion en tiempo de compilación: si el contrato gana un endpoint y aquí no
// se implementa, el build falla en vez de devolver un 404 en runtime.
var _ StrictServerInterface = (*Server)(nil)

func NewServer(db *pgxpool.Pool) *Server {
	return &Server{DB: db}
}

var errNoImplementado = errors.New("endpoint no implementado todavía")

func (s *Server) CrearComentario(ctx context.Context, request CrearComentarioRequestObject) (CrearComentarioResponseObject, error) {
	return nil, errNoImplementado
}

func (s *Server) LoginUser(ctx context.Context, request LoginUserRequestObject) (LoginUserResponseObject, error) {
	return nil, errNoImplementado
}

func (s *Server) RegisterUser(ctx context.Context, request RegisterUserRequestObject) (RegisterUserResponseObject, error) {
	return nil, errNoImplementado
}

func (s *Server) VerifyUser(ctx context.Context, request VerifyUserRequestObject) (VerifyUserResponseObject, error) {
	return nil, errNoImplementado
}

func (s *Server) GetReportes(ctx context.Context, request GetReportesRequestObject) (GetReportesResponseObject, error) {
	return nil, errNoImplementado
}

func (s *Server) CrearReporte(ctx context.Context, request CrearReporteRequestObject) (CrearReporteResponseObject, error) {
	return nil, errNoImplementado
}

func (s *Server) GetReporte(ctx context.Context, request GetReporteRequestObject) (GetReporteResponseObject, error) {
	return nil, errNoImplementado
}

func (s *Server) ApoyarReporte(ctx context.Context, request ApoyarReporteRequestObject) (ApoyarReporteResponseObject, error) {
	return nil, errNoImplementado
}

func (s *Server) GetComentarios(ctx context.Context, request GetComentariosRequestObject) (GetComentariosResponseObject, error) {
	return nil, errNoImplementado
}
