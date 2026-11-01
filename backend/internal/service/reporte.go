package service

import (
	"context"
	"strings"
	"time"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/db/sqlc"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/domain"
	"github.com/google/uuid"
)

// ReporteStore es el subconjunto de *database.Store que este servicio usa.
type ReporteStore interface {
	CreateReporte(ctx context.Context, arg domain.CreateReporteTxParams) (sqlc.Reporte, error)
	GetReporteById(ctx context.Context, id uuid.UUID) (sqlc.GetReporteByIdRow, error)
	GetPuntoOrigenByReporteId(ctx context.Context, reporteID uuid.UUID) (sqlc.GetPuntoOrigenByReporteIdRow, error)
	ListComentariosByReporteId(ctx context.Context, reporteID uuid.UUID) ([]sqlc.ListComentariosByReporteIdRow, error)
	ListMultimediaByReporteId(ctx context.Context, reporteID uuid.UUID) ([]sqlc.Multimedia, error)
	ListLocationsByReporteId(ctx context.Context, reporteID uuid.UUID) ([]sqlc.Location, error)
	ListReportesResumen(ctx context.Context, arg sqlc.ListReportesResumenParams) ([]sqlc.ListReportesResumenRow, error)
	ListTagsByReporteId(ctx context.Context, reporteID uuid.UUID) ([]sqlc.ListTagsByReporteIdRow, error)
	AddAvistamientoById(ctx context.Context, id uuid.UUID) (sqlc.AddAvistamientoByIdRow, error)
	ListReportesPorUbicacion(ctx context.Context, arg sqlc.ListReportesPorUbicacionParams) ([]sqlc.ListReportesPorUbicacionRow, error)
	ListReportesByUserId(ctx context.Context, arg sqlc.ListReportesByUserIdParams) ([]sqlc.ListReportesByUserIdRow, error)
	CambiarEstadoReporte(ctx context.Context, arg domain.CambiarEstadoReporteTxParams) (sqlc.Reporte, error)
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
// EsOficial solo lo puede pedir un rol que gestiona reportes
// (domain.PuedeGestionar).
func (s *ReporteService) Crear(ctx context.Context, nuevo domain.NuevoReporte) (domain.ReporteDetalle, error) {
	if nuevo.EsOficial && !domain.PuedeGestionar(nuevo.Rol) {
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
		Reporte: sqlc.CreateReporteParams{
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

	tagRows, err := s.store.ListTagsByReporteId(ctx, id)
	if err != nil {
		return domain.ReporteDetalle{}, err
	}
	tags := make([]domain.TagConteo, 0, len(tagRows))
	for _, t := range tagRows {
		tags = append(tags, domain.TagConteo{ID: t.ID, Nombre: t.Nombre, Count: t.Count})
	}

	locations, err := s.store.ListLocationsByReporteId(ctx, id)
	if err != nil {
		return domain.ReporteDetalle{}, err
	}

	return domain.ReporteDetalle{
		Reporte:     r.Reporte,
		Titulo:      domain.TituloReporte(r.IncidenteEtiqueta, r.Reporte.Direccion),
		Latitude:    punto.Latitude,
		Longitude:   punto.Longitude,
		Comentarios: comentarios,
		Multimedia:  multimedia,
		Tags:        tags,
		Locations:   locations}, nil
}

// toResumen convierte una fila de resumen en el modelo que devuelve el
// servicio. Las consultas de resumen devuelven las mismas columnas, así que
// sqlc genera structs idénticos y cualquiera se convierte a este.
func toResumen(r sqlc.ListReportesResumenRow) domain.ReporteResumen {
	return domain.ReporteResumen{
		ID:            r.ID,
		IncidenteID:   r.IncidenteID,
		Titulo:        domain.TituloReporte(r.IncidenteEtiqueta, r.Direccion),
		Direccion:     r.Direccion,
		EstadoActual:  r.EstadoActual,
		Avistamientos: r.Avistamientos,
		EsOficial:     r.EsOficial,
		Latitude:      r.Latitude,
		Longitude:     r.Longitude,
	}
}

func (s *ReporteService) Listar(ctx context.Context, minLat, maxLat, minLng, maxLng *float64) ([]domain.ReporteResumen, error) {
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

	rows, err := s.store.ListReportesResumen(ctx, sqlc.ListReportesResumenParams{
		MinLat: minLat,
		MaxLat: maxLat,
		MinLng: minLng,
		MaxLng: maxLng,
	})
	if err != nil {
		return nil, err
	}
	out := make([]domain.ReporteResumen, 0, len(rows))
	for _, r := range rows {
		out = append(out, toResumen(r))
	}
	return out, nil
}

func (s *ReporteService) ListarCercanos(ctx context.Context, lng, lat, radio float64, incidenteIds []int, estados []sqlc.Estado, desde *time.Time, limite int) ([]domain.ReporteCercano, error) {
	// La consulta recibe los estados como text[] (ver reporte.sql). Se deja
	// nil si no hay estados, porque nil es "sin filtro".
	var estadosTexto []string
	for _, e := range estados {
		estadosTexto = append(estadosTexto, string(e))
	}
	rows, err := s.store.ListReportesPorUbicacion(ctx, sqlc.ListReportesPorUbicacionParams{
		Lng:          lng,
		Lat:          lat,
		Radio:        radio,
		IncidenteIds: incidenteIds,
		Estados:      estadosTexto,
		Desde:        desde,
		Limite:       limite,
	})
	if err != nil {
		return nil, err
	}
	out := make([]domain.ReporteCercano, 0, len(rows))
	for _, r := range rows {
		out = append(out, domain.ReporteCercano{
			ReporteResumen: toResumen(sqlc.ListReportesResumenRow{
				ID:                r.ID,
				IncidenteID:       r.IncidenteID,
				EstadoActual:      r.EstadoActual,
				Avistamientos:     r.Avistamientos,
				EsOficial:         r.EsOficial,
				Latitude:          r.Latitude,
				Longitude:         r.Longitude,
				Direccion:         r.Direccion,
				IncidenteEtiqueta: r.IncidenteEtiqueta,
			}),
			DistanciaM: r.DistanciaM,
		})
	}
	return out, nil
}

// ListarPorUsuario devuelve los reportes que creó el usuario, del más reciente
// al más antiguo, incluidos los históricos.
func (s *ReporteService) ListarPorUsuario(ctx context.Context, userID uuid.UUID, limite int) ([]domain.ReporteResumen, error) {
	rows, err := s.store.ListReportesByUserId(ctx, sqlc.ListReportesByUserIdParams{
		UserID: userID,
		Limite: limite,
	})
	if err != nil {
		return nil, err
	}
	out := make([]domain.ReporteResumen, 0, len(rows))
	for _, r := range rows {
		out = append(out, toResumen(sqlc.ListReportesResumenRow(r)))
	}
	return out, nil
}

// AgregarAvistamiento suma un avistamiento al reporte y lo devuelve ya
// actualizado.
func (s *ReporteService) AgregarAvistamiento(ctx context.Context, id uuid.UUID) (domain.ReporteDetalle, error) {
	_, err := s.store.AddAvistamientoById(ctx, id)
	if domain.IsNotFound(err) {
		return domain.ReporteDetalle{}, domain.ErrReporteNotFound
	}
	if err != nil {
		return domain.ReporteDetalle{}, err
	}
	return s.Obtener(ctx, id)
}

// CambiarEstado cambia el estado del reporte y lo registra en el historial a
// nombre de userID. Solo lo puede hacer un rol que gestiona reportes
// (domain.PuedeGestionar), y solo hacia un estado al que el reporte puede
// pasar desde el actual (domain.ValidarTransicion, que la store aplica con
// la fila bloqueada).
func (s *ReporteService) CambiarEstado(ctx context.Context, rol string, userID, id uuid.UUID, estado sqlc.Estado) (domain.ReporteDetalle, error) {
	if !domain.PuedeGestionar(rol) {
		return domain.ReporteDetalle{}, domain.ErrEstadoNoPermitido
	}
	if !domain.EstadoValido(estado) {
		return domain.ReporteDetalle{}, domain.ErrEstadoInvalido
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
