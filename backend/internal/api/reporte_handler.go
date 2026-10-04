package api

import (
	"context"
	"errors"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/domain"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/middleware"
)

func toReporte(r domain.ReporteDetalle) Reporte {
	out := Reporte{
		Avistamientos: r.Reporte.Avistamientos,
		Comentarios:   make([]Comentario, 0, len(r.Comentarios)),
		CreatedAt:     r.Reporte.CreatedAt,
		EsHistorico:   r.Reporte.EsHistorico,
		EsOficial:     r.Reporte.EsOficial,
		EstadoActual:  EstadoReporte(r.Reporte.EstadoActual),
		ExpiredAt:     r.Reporte.ExpiredAt,
		Fotos:         make([]Foto, 0, len(r.Fotos)),
		Id:            r.Reporte.ID,
		IncidenteId:   r.Reporte.IncidenteID,
		Latitude:      r.Latitude,
		Longitude:     r.Longitude,
		Locations:     make([]Location, 0, len(r.Locations)),
		Tags:          make([]Tag, 0, len(r.Tags)),
		UpdatedAt:     r.Reporte.UpdatedAt,
	}

	for _, c := range r.Comentarios {
		out.Comentarios = append(out.Comentarios, toComentario(c))
	}

	for _, f := range r.Fotos {
		out.Fotos = append(out.Fotos, Foto{CreatedAt: f.CreatedAt, Id: f.ID, ImagePath: f.ImagePath, UserId: f.UserID})
	}

	for _, t := range r.Tags {
		out.Tags = append(out.Tags, Tag{Count: t.Count, Id: t.ID, Nombre: t.Nombre})
	}

	for _, l := range r.Locations {
		out.Locations = append(out.Locations, Location{CreatedAt: l.CreatedAt, Id: l.ID, Latitude: l.Latitude, Longitude: l.Longitude, UserId: l.UserID})
	}

	return out
}

// CrearReporte crea un reporte con la ubicación y foto del usuario autenticado.
func (s *Server) CrearReporte(ctx context.Context, request CrearReporteRequestObject) (CrearReporteResponseObject, error) {
	userID, ok := middleware.UserIDFromContext(ctx)
	if !ok {
		return nil, errors.New("userID not found in context")
	}

	b := request.Body
	r, err := s.services.Reportes.Crear(ctx, userID, b.IncidenteId, b.Latitude, b.Longitude, b.ImagePath)
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
		if errors.Is(err, domain.ErrReporteNotFound) {
			return ObtenerReporte404JSONResponse{Message: "reporte no encontrado"}, nil
		}
		return nil, err
	}

	return ObtenerReporte200JSONResponse(toReporte(r)), nil
}

func toReporteResumen(r domain.ListReportesResumenRow) ReporteResumen {
	return ReporteResumen{
		Id:            r.ID,
		IncidenteId:   r.IncidenteID,
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
		if errors.Is(err, domain.ErrAreaIncompleta) {
			return ListarReportes400JSONResponse{Message: "area incompleta"}, nil
		}
		if errors.Is(err, domain.ErrAreaInvalida) {
			return ListarReportes400JSONResponse{Message: "area invalida"}, nil
		}
		return nil, err
	}
	res := make(ListarReportes200JSONResponse, 0, len(rows))
	for _, row := range rows {
		res = append(res, toReporteResumen(row))
	}
	return res, nil
}

func (s *Server) AgregarAvistamiento(ctx context.Context, request AgregarAvistamientoRequestObject) (AgregarAvistamientoResponseObject, error) {
	if _, err := s.services.Reportes.AgregarAvistamiento(ctx, request.ReporteId); err != nil {
		if errors.Is(err, domain.ErrReporteNotFound) {
			return AgregarAvistamiento404JSONResponse{Message: "reporte no encontrado"}, nil
		}
		return nil, err
	}

	r, err := s.services.Reportes.Obtener(ctx, request.ReporteId)
	if err != nil {
		return nil, err
	}
	return AgregarAvistamiento200JSONResponse(toReporte(r)), nil
}
