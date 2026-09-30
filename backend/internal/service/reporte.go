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
	GetPuntoOrigenByReporteId(ctx context.Context, reporteID uuid.UUID) (domain.GetPuntoOrigenByReporteIdRow, error)
	ListComentariosByReporteId(ctx context.Context, reporteID uuid.UUID) ([]domain.Comentario, error)
	ListFotosByReporteId(ctx context.Context, reporteID uuid.UUID) ([]domain.FotosReporte, error)
	ListLocationsByReporteId(ctx context.Context, reporteID uuid.UUID) ([]domain.ListLocationsByReporteIdRow, error)
	ListReportesResumen(ctx context.Context, arg domain.ListReportesResumenParams) ([]domain.ListReportesResumenRow, error)
	ListTagsByReporteId(ctx context.Context, reporteID uuid.UUID) ([]domain.ListTagsByReporteIdRow, error)
	AddAvistamientoById(ctx context.Context, id uuid.UUID) (domain.AddAvistamientoByIdRow, error)
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
func (s *ReporteService) Crear(ctx context.Context, userID uuid.UUID, incidenteID int, latitude, longitude float64, imagePath *string) (domain.ReporteDetalle, error) {
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
		return domain.ReporteDetalle{}, domain.ErrIncidenteNotFound
	}
	if err != nil {
		return domain.ReporteDetalle{}, err
	}
	return s.Obtener(ctx, r.ID)
}

// Obtener devuelve el reporte con el id dado
func (s *ReporteService) Obtener(ctx context.Context, id uuid.UUID) (domain.ReporteDetalle, error) {
	r, err := s.store.GetReporteById(ctx, id)
	if domain.IsNotFound(err) {
		return domain.ReporteDetalle{}, domain.ErrReporteNotFound
	}
	if err != nil {
		return domain.ReporteDetalle{}, err
	}

	punto, err := s.store.GetPuntoOrigenByReporteId(ctx, id)
	if err != nil {
		return domain.ReporteDetalle{}, err
	}

	comentarios, err := s.store.ListComentariosByReporteId(ctx, id)
	if err != nil {
		return domain.ReporteDetalle{}, err
	}

	fotos, err := s.store.ListFotosByReporteId(ctx, id)
	if err != nil {
		return domain.ReporteDetalle{}, err
	}

	tags, err := s.store.ListTagsByReporteId(ctx, id)
	if err != nil {
		return domain.ReporteDetalle{}, err
	}

	locations, err := s.store.ListLocationsByReporteId(ctx, id)
	if err != nil {
		return domain.ReporteDetalle{}, err
	}

	return domain.ReporteDetalle{
		Reporte:     r,
		Latitude:    punto.Latitude,
		Longitude:   punto.Longitude,
		Comentarios: comentarios,
		Fotos:       fotos,
		Tags:        tags,
		Locations:   locations}, nil
}

func (s *ReporteService) Listar(ctx context.Context, minLat, maxLat, minLng, maxLng *float64) ([]domain.ListReportesResumenRow, error) {
	n := 0
	for _, v := range []*float64{minLat, maxLat, minLng, maxLng} {
		if v != nil {
			n++
		}
	}

	if n != 0 && n != 4 {
		return nil, domain.ErrAreaIncompleta
	}
	if n == 4 && (*minLat > *maxLat || *minLng > *maxLng) {
		return nil, domain.ErrAreaInvalida
	}

	return s.store.ListReportesResumen(ctx, domain.ListReportesResumenParams{
		MinLat: minLat,
		MaxLat: maxLat,
		MinLng: minLng,
		MaxLng: maxLng,
	})
}

func (s *ReporteService) AgregarAvistamiento(ctx context.Context, id uuid.UUID) (domain.AddAvistamientoByIdRow, error) {
	a, err := s.store.AddAvistamientoById(ctx, id)
	if domain.IsNotFound(err) {
		return domain.AddAvistamientoByIdRow{}, domain.ErrReporteNotFound
	}
	if err != nil {
		return domain.AddAvistamientoByIdRow{}, err
	}
	return a, nil
}
