package service

import (
	"context"
	"strings"
	"time"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/domain"
	"github.com/google/uuid"
)

// ReporteStore es el subconjunto de *database.Store que este servicio usa.
type ReporteStore interface {
	CreateReporte(ctx context.Context, arg domain.CreateReporteTxParams) (domain.Reporte, error)
	GetReporteById(ctx context.Context, id uuid.UUID) (domain.GetReporteByIdRow, error)
	GetPuntoOrigenByReporteId(ctx context.Context, reporteID uuid.UUID) (domain.GetPuntoOrigenByReporteIdRow, error)
	ListComentariosByReporteId(ctx context.Context, reporteID uuid.UUID) ([]domain.ListComentariosByReporteIdRow, error)
	ListMultimediaByReporteId(ctx context.Context, reporteID uuid.UUID) ([]domain.Multimedia, error)
	ListLocationsByReporteId(ctx context.Context, reporteID uuid.UUID) ([]domain.Location, error)
	ListReportesResumen(ctx context.Context, arg domain.ListReportesResumenParams) ([]domain.ListReportesResumenRow, error)
	ListTagsByReporteId(ctx context.Context, reporteID uuid.UUID) ([]domain.ListTagsByReporteIdRow, error)
	AddAvistamientoById(ctx context.Context, id uuid.UUID) (domain.AddAvistamientoByIdRow, error)
	ListReportesPorUbicacion(ctx context.Context, arg domain.ListReportesPorUbicacionParams) ([]domain.ListReportesPorUbicacionRow, error)
	ListReportesByUserId(ctx context.Context, arg domain.ListReportesByUserIdParams) ([]domain.ListReportesByUserIdRow, error)
	CambiarEstadoReporte(ctx context.Context, arg domain.CambiarEstadoReporteTxParams) (domain.Reporte, error)
}

type ReporteService struct {
	store ReporteStore
}

// NewReporteService crea un servicio de reportes con la store dada.
func NewReporteService(store ReporteStore) *ReporteService {
	return &ReporteService{store: store}
}

// Crear crea un reporte del incidente dado, con la ubicación inicial del
// usuario. La foto o el video se suben después con MultimediaService.Subir.
//
// EsOficial lo puede pedir cualquier rol menos ciudadano. Se compara contra
// ciudadano (y no contra una lista de roles permitidos) para que un rol nuevo
// en la tabla roles pueda crear reportes oficiales sin tocar este código.
func (s *ReporteService) Crear(ctx context.Context, nuevo domain.NuevoReporte) (domain.ReporteDetalle, error) {
	if nuevo.EsOficial && (nuevo.Rol == "" || nuevo.Rol == domain.RolCiudadano) {
		return domain.ReporteDetalle{}, domain.ErrOficialNoPermitido
	}

	// Una dirección vacía o solo con espacios se guarda como NULL, para que el
	// título derivado no quede como "<incidente> en ".
	var direccion *string
	if nuevo.Direccion != nil {
		if d := strings.TrimSpace(*nuevo.Direccion); d != "" {
			direccion = &d
		}
	}

	r, err := s.store.CreateReporte(ctx, domain.CreateReporteTxParams{
		Reporte: domain.CreateReporteParams{
			IncidenteID: nuevo.IncidenteID,
			EsOficial:   nuevo.EsOficial,
			Direccion:   direccion,
		},
		UserID:    nuevo.UserID,
		Latitude:  nuevo.Latitude,
		Longitude: nuevo.Longitude,
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

	rows, err := s.store.ListComentariosByReporteId(ctx, id)
	if err != nil {
		return domain.ReporteDetalle{}, err
	}
	comentarios := make([]domain.ComentarioConAutor, 0, len(rows))
	for _, c := range rows {
		comentarios = append(comentarios, domain.ComentarioConAutor{
			ID:         c.ID,
			ReporteID:  c.ReporteID,
			UserID:     c.UserID,
			Comentario: c.Comentario,
			CreatedAt:  c.CreatedAt,
			Username:   c.Username,
			RolName:    c.RolName,
		})
	}

	multimedia, err := s.store.ListMultimediaByReporteId(ctx, id)
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
		Reporte:           r.Reporte,
		IncidenteEtiqueta: r.IncidenteEtiqueta,
		Latitude:          punto.Latitude,
		Longitude:         punto.Longitude,
		Comentarios:       comentarios,
		Multimedia:        multimedia,
		Tags:              tags,
		Locations:         locations}, nil
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

func (s *ReporteService) ListarCercanos(ctx context.Context, lng, lat, radio float64, incidenteIds []int, estados []domain.Estado, desde *time.Time, limite int) ([]domain.ListReportesPorUbicacionRow, error) {
	// La consulta recibe los estados como text[] (ver reporte.sql). Se deja
	// nil si no hay estados, porque nil es "sin filtro".
	var estadosTexto []string
	for _, e := range estados {
		estadosTexto = append(estadosTexto, string(e))
	}
	return s.store.ListReportesPorUbicacion(ctx, domain.ListReportesPorUbicacionParams{
		Lng:          lng,
		Lat:          lat,
		Radio:        radio,
		IncidenteIds: incidenteIds,
		Estados:      estadosTexto,
		Desde:        desde,
		Limite:       limite,
	})
}

// ListarPorUsuario devuelve los reportes que creó el usuario, del más reciente
// al más antiguo, incluidos los históricos.
func (s *ReporteService) ListarPorUsuario(ctx context.Context, userID uuid.UUID, limite int) ([]domain.ListReportesByUserIdRow, error) {
	return s.store.ListReportesByUserId(ctx, domain.ListReportesByUserIdParams{
		UserID: userID,
		Limite: limite,
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

// CambiarEstado cambia el estado del reporte y lo registra en el historial a
// nombre de userID. Lo puede hacer cualquier rol menos ciudadano.
func (s *ReporteService) CambiarEstado(ctx context.Context, rol string, userID, id uuid.UUID, estado domain.Estado) (domain.ReporteDetalle, error) {
	if rol == "" || rol == domain.RolCiudadano {
		return domain.ReporteDetalle{}, domain.ErrEstadoNoPermitido
	}

	_, err := s.store.CambiarEstadoReporte(ctx, domain.CambiarEstadoReporteTxParams{
		ID: id, Estado: estado, ActorID: userID,
	})

	if domain.IsNotFound(err) {
		return domain.ReporteDetalle{}, domain.ErrReporteNotFound
	}
	if err != nil {
		return domain.ReporteDetalle{}, err
	}
	return s.Obtener(ctx, id)
}
