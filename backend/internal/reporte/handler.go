package reporte

import (
	"context"
	"errors"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/db/sqlc"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/httpapi"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/httperr"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/middleware"
)

// Handler implementa las operaciones de reportes del contrato; el servidor
// lo embebe junto con los de las demás funcionalidades.
type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

func toComentario(c Comentario) httpapi.Comentario {
	return httpapi.Comentario{
		Comentario: c.Comentario,
		CreatedAt:  c.CreatedAt,
		Id:         c.ID,
		ReporteId:  c.ReporteID,
		RolName:    &c.RolName,
		UserId:     c.UserID,
		Username:   &c.Username,
	}
}

func toReporte(r Detalle) httpapi.Reporte {
	out := httpapi.Reporte{
		Avistamientos: r.Reporte.Avistamientos,
		Comentarios:   make([]httpapi.Comentario, 0, len(r.Comentarios)),
		CreatedAt:     r.Reporte.CreatedAt,
		Direccion:     r.Reporte.Direccion,
		EsHistorico:   r.Reporte.EsHistorico,
		EsOficial:     r.Reporte.EsOficial,
		EstadoActual:  httpapi.EstadoReporte(r.Reporte.EstadoActual),
		Id:            r.Reporte.ID,
		IncidenteId:   r.Reporte.IncidenteID,
		Titulo:        r.Titulo,
		Latitude:      r.Latitude,
		Longitude:     r.Longitude,
		Locations:     make([]httpapi.Location, 0, len(r.Locations)),
		Multimedia:    make([]httpapi.Multimedia, 0, len(r.Multimedia)),
		Tags:          make([]httpapi.Tag, 0, len(r.Tags)),
		UpdatedAt:     r.Reporte.UpdatedAt,
	}

	for _, c := range r.Comentarios {
		out.Comentarios = append(out.Comentarios, toComentario(c))
	}

	for _, m := range r.Multimedia {
		out.Multimedia = append(out.Multimedia, httpapi.Multimedia{CreatedAt: m.CreatedAt, Id: m.ID, Path: m.Path, UserId: m.UserID})
	}

	for _, t := range r.Tags {
		out.Tags = append(out.Tags, httpapi.Tag{Count: t.Count, Id: t.ID, Nombre: t.Nombre})
	}

	for _, l := range r.Locations {
		out.Locations = append(out.Locations, httpapi.Location{CreatedAt: l.CreatedAt, Id: l.ID, Latitude: l.Latitude, Longitude: l.Longitude, UserId: l.UserID})
	}

	return out
}

// CrearReporte crea un reporte con la ubicación del usuario autenticado. La foto
// se sube después con SubirMultimedia.
func (h *Handler) CrearReporte(ctx context.Context, request httpapi.CrearReporteRequestObject) (httpapi.CrearReporteResponseObject, error) {
	userID, ok := middleware.UserIDFromContext(ctx)
	if !ok {
		return nil, httperr.ErrNoAutenticado
	}

	// Sin rol en el contexto (token anterior al claim "rol") se trata como
	// ciudadano: el servicio rechaza es_oficial si rol viene vacío.
	rol, _ := middleware.RolFromContext(ctx)

	b := request.Body
	esOficial := b.EsOficial != nil && *b.EsOficial

	nuevoReporte := Nuevo{
		UserID:      userID,
		Rol:         rol,
		IncidenteID: b.IncidenteId,
		Latitude:    b.Latitude,
		Longitude:   b.Longitude,
		EsOficial:   esOficial,
		Direccion:   b.Direccion,
	}
	r, err := h.svc.Crear(ctx, nuevoReporte)
	if err != nil {
		if errors.Is(err, ErrIncidenteNotFound) {
			return httpapi.CrearReporte400JSONResponse{Message: "incidente no encontrado"}, nil
		}
		return nil, err

	}

	return httpapi.CrearReporte201JSONResponse(toReporte(r)), nil
}

// ObtenerReporte devuelve un reporte por su id.
func (h *Handler) ObtenerReporte(ctx context.Context, request httpapi.ObtenerReporteRequestObject) (httpapi.ObtenerReporteResponseObject, error) {
	r, err := h.svc.Obtener(ctx, request.ReporteId)
	if err != nil {
		return nil, err
	}

	return httpapi.ObtenerReporte200JSONResponse(toReporte(r)), nil
}

func toReporteResumen(r Resumen) httpapi.ReporteResumen {
	return httpapi.ReporteResumen{
		Id:            r.ID,
		IncidenteId:   r.IncidenteID,
		Titulo:        r.Titulo,
		Direccion:     r.Direccion,
		EstadoActual:  httpapi.EstadoReporte(r.EstadoActual),
		Avistamientos: r.Avistamientos,
		EsOficial:     r.EsOficial,
		Latitude:      r.Latitude,
		Longitude:     r.Longitude,
	}
}

// ListarReportes devuelve los reportes para el mapa.
func (h *Handler) ListarReportes(ctx context.Context, request httpapi.ListarReportesRequestObject) (httpapi.ListarReportesResponseObject, error) {
	p := request.Params
	rows, err := h.svc.Listar(ctx, p.MinLat, p.MaxLat, p.MinLng, p.MaxLng)
	if err != nil {
		return nil, err
	}
	res := make(httpapi.ListarReportes200JSONResponse, 0, len(rows))
	for _, row := range rows {
		res = append(res, toReporteResumen(row))
	}
	return res, nil
}

func toEstado(e httpapi.EstadoReporte) sqlc.Estado {
	return sqlc.Estado(e)
}

func toReporteCercano(r Cercano) httpapi.ReporteCercano {
	return httpapi.ReporteCercano{
		Avistamientos: r.Avistamientos,
		Direccion:     r.Direccion,
		DistanciaM:    r.DistanciaM,
		EsOficial:     r.EsOficial,
		EstadoActual:  httpapi.EstadoReporte(r.EstadoActual),
		Id:            r.ID,
		IncidenteId:   r.IncidenteID,
		Latitude:      r.Latitude,
		Longitude:     r.Longitude,
		Titulo:        r.Titulo,
	}
}

func (h *Handler) ListarReportesCercanos(ctx context.Context, request httpapi.ListarReportesCercanosRequestObject) (httpapi.ListarReportesCercanosResponseObject, error) {
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

	rows, err := h.svc.ListarCercanos(ctx, p.Lng, p.Lat, p.Radio, incidenteIds, estados, p.Desde, limite)
	if err != nil {
		return nil, err
	}
	res := make(httpapi.ListarReportesCercanos200JSONResponse, 0, len(rows))
	for _, row := range rows {
		res = append(res, toReporteCercano(row))
	}
	return res, nil
}

// ListarMisReportes devuelve los reportes que creó el usuario autenticado.
func (h *Handler) ListarMisReportes(ctx context.Context, request httpapi.ListarMisReportesRequestObject) (httpapi.ListarMisReportesResponseObject, error) {
	userID, ok := middleware.UserIDFromContext(ctx)
	if !ok {
		return nil, httperr.ErrNoAutenticado
	}

	limite := 200
	if request.Params.Limite != nil {
		limite = *request.Params.Limite
	}

	rows, err := h.svc.ListarPorUsuario(ctx, userID, limite)
	if err != nil {
		return nil, err
	}
	res := make(httpapi.ListarMisReportes200JSONResponse, 0, len(rows))
	for _, row := range rows {
		res = append(res, toReporteResumen(row))
	}
	return res, nil
}

func (h *Handler) AgregarAvistamiento(ctx context.Context, request httpapi.AgregarAvistamientoRequestObject) (httpapi.AgregarAvistamientoResponseObject, error) {
	r, err := h.svc.AgregarAvistamiento(ctx, request.ReporteId)
	if err != nil {
		return nil, err
	}
	return httpapi.AgregarAvistamiento200JSONResponse(toReporte(r)), nil
}

// CambiarEstadoReporte cambia el estado de un reporte. Qué rol puede y a qué
// estados se puede pasar lo decide el servicio; aquí solo se traducen sus
// errores. El router no valida el body contra el contrato, así que un estado
// fuera del enum (o ausente) llega al servicio y vuelve como 400.
func (h *Handler) CambiarEstadoReporte(ctx context.Context, request httpapi.CambiarEstadoReporteRequestObject) (httpapi.CambiarEstadoReporteResponseObject, error) {
	userID, ok := middleware.UserIDFromContext(ctx)
	if !ok {
		return nil, httperr.ErrNoAutenticado
	}

	rol, _ := middleware.RolFromContext(ctx)
	r, err := h.svc.CambiarEstado(ctx, rol, userID, request.ReporteId, sqlc.Estado(request.Body.Estado))
	if err != nil {
		return nil, err
	}
	return httpapi.CambiarEstadoReporte200JSONResponse(toReporte(r)), nil
}
