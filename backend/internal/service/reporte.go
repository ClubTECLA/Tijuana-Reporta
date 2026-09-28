package service

import (
	"context"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/domain"
	"github.com/google/uuid"
)

// ReporteStore es el subconjunto de *database.Store que este servicio usa.
type ReporteStore interface {
	CreateReporte(ctx context.Context, arg domain.CreateReporteTxParams) (domain.Reporte, error)
}

type ReporteService struct {
	store ReporteStore
}

// NewReporteService crea un servicio de reportes con la store dada.
func NewReporteService(store ReporteStore) *ReporteService {
	return &ReporteService{store: store}
}

// Crear crea un reporte del incidente dado, con la ubicación inicial del
// usuario y, si la hay, su foto. fotos_reportes admite una sola foto por
// usuario por reporte, así que al crear solo puede venir una.
func (s *ReporteService) Crear(ctx context.Context, userID uuid.UUID, incidenteID int, latitude, longitude float64, imagePath *string) (domain.Reporte, error) {
	var imagePaths []string
	if imagePath != nil {
		imagePaths = []string{*imagePath}
	}

	return s.store.CreateReporte(ctx, domain.CreateReporteTxParams{
		Reporte:    domain.CreateReporteParams{IncidenteID: incidenteID},
		UserID:     userID,
		Latitude:   latitude,
		Longitude:  longitude,
		ImagePaths: imagePaths,
	})
}
