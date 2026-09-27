package service

import (
	"context"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/domain"
	"github.com/google/uuid"
)

// ReporteStore es el subconjunto de *database.Store que este servicio usa.
type ReporteStore interface {
	CreateReporte(ctx context.Context, arg domain.CreateReporteTxParams) (domain.Reporte, error)
	GetReporteById(ctx context.Context, id uuid.UUID) (domain.Reporte, error)
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

	r, err := s.store.CreateReporte(ctx, domain.CreateReporteTxParams{
		Reporte:    domain.CreateReporteParams{IncidenteID: incidenteID},
		UserID:     userID,
		Latitude:   latitude,
		Longitude:  longitude,
		ImagePaths: imagePaths,
	})
	if domain.IsForeignKeyViolation(err, "reporte_incidente_id_fkey") {
		return domain.Reporte{}, domain.ErrIncidenteNotFound
	}
	return r, err
}

// Obtener devuelve el reporte con el id dado
func (s *ReporteService) Obtener(ctx context.Context, id uuid.UUID) (domain.Reporte, error) {
	r, err := s.store.GetReporteById(ctx, id)
	if domain.IsNotFound(err) {
		return domain.Reporte{}, domain.ErrReporteNotFound
	}
	return r, err
}
