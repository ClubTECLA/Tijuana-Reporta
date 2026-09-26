package api

import (
	"context"
	"errors"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/middleware"
)

// CrearReporte crea un reporte con la ubicación y foto del usuario autenticado.
func (s *Server) CrearReporte(ctx context.Context, request CrearReporteRequestObject) (CrearReporteResponseObject, error) {
	userID, ok := middleware.UserIDFromContext(ctx)
	if !ok {
		return nil, errors.New("userID not found in context")
	}

	b := request.Body
	r, err := s.services.Reportes.Crear(ctx, userID, b.IncidenteId, b.Latitude, b.Longitude, b.ImagePath)
	if err != nil {
		return nil, err
	}

	return CrearReporte201JSONResponse{
		Id:            r.ID,
		IncidenteId:   r.IncidenteID,
		Avistamientos: r.Avistamientos,
		EsHistorico:   r.EsHistorico,
		EsOficial:     r.EsOficial,
		EstadoActual:  string(r.EstadoActual),
		CreatedAt:     r.CreatedAt,
		UpdatedAt:     r.UpdatedAt,
		ExpiredAt:     r.ExpiredAt,
	}, nil
}
