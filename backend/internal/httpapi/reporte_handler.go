package httpapi

import (
	"context"
	"errors"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/db/sqlc"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/domain"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/httperr"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/middleware"
)

func toReporte(r domain.ReporteDetalle) Reporte {
	out := Reporte{
		Avistamientos: r.Reporte.Avistamientos,
		Comentarios:   make([]Comentario, 0, len(r.Comentarios)),
		CreatedAt:     r.Reporte.CreatedAt,
		Direccion:     r.Reporte.Direccion,
		EsHistorico:   r.Reporte.EsHistorico,
		EsOficial:     r.Reporte.EsOficial,
		EstadoActual:  EstadoReporte(r.Reporte.EstadoActual),
		Id:            r.Reporte.ID,
		IncidenteId:   r.Reporte.IncidenteID,
		Titulo:        r.Titulo,
		Latitude:      r.Latitude,
		Longitude:     r.Longitude,
		Locations:     make([]Location, 0, len(r.Locations)),
		Multimedia:    make([]Multimedia, 0, len(r.Multimedia)),
		Tags:          make([]Tag, 0, len(r.Tags)),
		UpdatedAt:     r.Reporte.UpdatedAt,
	}

	for _, c := range r.Comentarios {
		out.Comentarios = append(out.Comentarios, toComentario(c))
	}

	for _, m := range r.Multimedia {
		out.Multimedia = append(out.Multimedia, Multimedia{CreatedAt: m.CreatedAt, Id: m.ID, Path: m.Path, UserId: m.UserID})
	}

	for _, t := range r.Tags {
		out.Tags = append(out.Tags, Tag{Count: t.Count, Id: t.ID, Nombre: t.Nombre})
	}

	for _, l := range r.Locations {
		out.Locations = append(out.Locations, Location{CreatedAt: l.CreatedAt, Id: l.ID, Latitude: l.Latitude, Longitude: l.Longitude, UserId: l.UserID})
	}

	return out
}

// CrearReporte crea un reporte con la ubicación del usuario autenticado. La foto
// se sube después con SubirMultimedia.
func (s *Server) CrearReporte(ctx context.Context, request CrearReporteRequestObject) (CrearReporteResponseObject, error) {
	userID, ok := middleware.UserIDFromContext(ctx)
	if !ok {
		return nil, httperr.ErrNoAutenticado
	}

	// Sin rol en el contexto (token anterior al claim "rol") se trata como
	// ciudadano: el servicio rechaza es_oficial si rol viene vacío.
	rol, _ := middleware.RolFromContext(ctx)

	b := request.Body
	esOficial := b.EsOficial != nil && *b.EsOficial

	nuevoReporte := domain.NuevoReporte{
		UserID:      userID,
		Rol:         rol,
		IncidenteID: b.IncidenteId,
		Latitude:    b.Latitude,
		Longitude:   b.Longitude,
		EsOficial:   esOficial,
		Direccion:   b.Direccion,
	}
	r, err := s.services.Reportes.Crear(ctx, nuevoReporte)
	if err != nil {
		if errors.Is(err, domain.ErrIncidenteNotFound) {
			return CrearReporte400JSONResponse{Message: "incidente no encontrado"}, nil
		}
		return nil, err

	}

	return CrearReporte201JSONResponse(toReporte(r)), nil
}

// ObtenerReporte devuelve un reporte por su id.
func (s *Server) ObtenerReporte(ctx context.Context, request ObtenerReporteRequestObject) (ObtenerReporteResponseObject, error) {
	r, err := s.services.Reportes.Obtener(ctx, request.ReporteId)
	if err != nil {
		return nil, err
	}

	return ObtenerReporte200JSONResponse(toReporte(r)), nil
}

func toReporteResumen(r domain.ReporteResumen) ReporteResumen {
	return ReporteResumen{
		Id:            r.ID,
		IncidenteId:   r.IncidenteID,
		Titulo:        r.Titulo,
		Direccion:     r.Direccion,
		EstadoActual:  EstadoReporte(r.EstadoActual),
		Avistamientos: r.Avistamientos,
		EsOficial:     r.EsOficial,
		Latitude:      r.Latitude,
		Longitude:     r.Longitude,
	}
}

// ListarReportes devuelve los reportes para el mapa.
func (s *Server) ListarReportes(ctx context.Context, request ListarReportesRequestObject) (ListarReportesResponseObject, error) {
	p := request.Params
	rows, err := s.services.Reportes.Listar(ctx, p.MinLat, p.MaxLat, p.MinLng, p.MaxLng)
	if err != nil {
		return nil, err
	}
	res := make(ListarReportes200JSONResponse, 0, len(rows))
	for _, row := range rows {
		res = append(res, toReporteResumen(row))
	}
	return res, nil
}

func toEstado(e EstadoReporte) sqlc.Estado {
	return sqlc.Estado(e)
}

func toReporteCercano(r domain.ReporteCercano) ReporteCercano {
	return ReporteCercano{
		Avistamientos: r.Avistamientos,
		Direccion:     r.Direccion,
		DistanciaM:    r.DistanciaM,
		EsOficial:     r.EsOficial,
		EstadoActual:  EstadoReporte(r.EstadoActual),
		Id:            r.ID,
		IncidenteId:   r.IncidenteID,
		Latitude:      r.Latitude,
		Longitude:     r.Longitude,
		Titulo:        r.Titulo,
	}
}

func (s *Server) ListarReportesCercanos(ctx context.Context, request ListarReportesCercanosRequestObject) (ListarReportesCercanosResponseObject, error) {
	p := request.Params
	limite := 200
	if p.Limite != nil {
		limite = *p.Limite
	}

	var estados []sqlc.Estado
	if p.Estado != nil {
		for _, estado := range *p.Estado {
			estados = append(estados, toEstado(estado))
		}
	}

	var incidenteIds []int
	if p.IncidenteId != nil {
		incidenteIds = *p.IncidenteId
	}

	rows, err := s.services.Reportes.ListarCercanos(ctx, p.Lng, p.Lat, p.Radio, incidenteIds, estados, p.Desde, limite)
	if err != nil {
		return nil, err
	}
	res := make(ListarReportesCercanos200JSONResponse, 0, len(rows))
	for _, row := range rows {
		res = append(res, toReporteCercano(row))
	}
	return res, nil
}

// ListarMisReportes devuelve los reportes que creó el usuario autenticado.
func (s *Server) ListarMisReportes(ctx context.Context, request ListarMisReportesRequestObject) (ListarMisReportesResponseObject, error) {
	userID, ok := middleware.UserIDFromContext(ctx)
	if !ok {
		return nil, httperr.ErrNoAutenticado
	}

	limite := 200
	if request.Params.Limite != nil {
		limite = *request.Params.Limite
	}

	rows, err := s.services.Reportes.ListarPorUsuario(ctx, userID, limite)
	if err != nil {
		return nil, err
	}
	res := make(ListarMisReportes200JSONResponse, 0, len(rows))
	for _, row := range rows {
		res = append(res, toReporteResumen(row))
	}
	return res, nil
}

func (s *Server) AgregarAvistamiento(ctx context.Context, request AgregarAvistamientoRequestObject) (AgregarAvistamientoResponseObject, error) {
	r, err := s.services.Reportes.AgregarAvistamiento(ctx, request.ReporteId)
	if err != nil {
		return nil, err
	}
	return AgregarAvistamiento200JSONResponse(toReporte(r)), nil
}

// CambiarEstadoReporte cambia el estado de un reporte. Qué rol puede y a qué
// estados se puede pasar lo decide el servicio; aquí solo se traducen sus
// errores. El router no valida el body contra el contrato, así que un estado
// fuera del enum (o ausente) llega al servicio y vuelve como 400.
func (s *Server) CambiarEstadoReporte(ctx context.Context, request CambiarEstadoReporteRequestObject) (CambiarEstadoReporteResponseObject, error) {
	userID, ok := middleware.UserIDFromContext(ctx)
	if !ok {
		return nil, httperr.ErrNoAutenticado
	}

	rol, _ := middleware.RolFromContext(ctx)
	r, err := s.services.Reportes.CambiarEstado(ctx, rol, userID, request.ReporteId, sqlc.Estado(request.Body.Estado))
	if err != nil {
		return nil, err
	}
	return CambiarEstadoReporte200JSONResponse(toReporte(r)), nil
}
