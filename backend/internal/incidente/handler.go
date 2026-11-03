package incidente

import (
	"context"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/db/sqlc"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/httpapi"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/httperr"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/middleware"
)

// Handler implementa las operaciones de incidentes del contrato; el servidor
// lo embebe junto con los de las demás funcionalidades.
type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

// toTagsCatalogo convierte tags del dominio en los TagCatalogo del contrato.
// Siempre devuelve un slice (nunca nil) para que el JSON lleve [] y no null,
// como pide el contrato.
func toTagsCatalogo(tags []sqlc.Tag) []httpapi.TagCatalogo {
	out := make([]httpapi.TagCatalogo, 0, len(tags))
	for _, t := range tags {
		out = append(out, httpapi.TagCatalogo{Id: t.ID, Nombre: t.Nombre, Peso: t.Peso})
	}
	return out
}

// toIncidente convierte un Detalle en el Incidente del
// contrato.
func toIncidente(d Detalle) httpapi.Incidente {
	return httpapi.Incidente{
		Color:        d.Incidente.Color,
		EstaActivo:   d.Incidente.EstaActivo,
		Etiqueta:     d.Incidente.Etiqueta,
		Id:           d.Incidente.ID,
		Nombre:       d.Incidente.Nombre,
		Radio:        d.Incidente.Radio,
		Tags:         toTagsCatalogo(d.Tags),
		TiempoLimite: d.Incidente.TiempoLimite,
	}
}

// toNuevosTags convierte los tags de la petición en lo que pide el servicio.
func toNuevosTags(tags []httpapi.CrearTagRequest) []NuevoTag {
	out := make([]NuevoTag, 0, len(tags))
	for _, t := range tags {
		out = append(out, NuevoTag{Nombre: t.Nombre, Peso: t.Peso})
	}
	return out
}

// toNuevoIncidente convierte el body de la petición en lo que pide el
// servicio. Los opcionales se pasan tal cual (nil si no se mandaron): los
// valores por defecto los pone el servicio.
func toNuevoIncidente(b *httpapi.CrearIncidenteRequest) Nuevo {
	nuevo := Nuevo{
		Nombre:       b.Nombre,
		Etiqueta:     b.Etiqueta,
		Color:        b.Color,
		EstaActivo:   b.EstaActivo,
		TiempoLimite: b.TiempoLimite,
		Radio:        b.Radio,
	}
	if b.Tags != nil {
		nuevo.Tags = toNuevosTags(*b.Tags)
	}
	return nuevo
}

// ListarIncidentes devuelve los incidentes con sus tags. Por defecto solo los
// activos; con ?incluir_inactivos=true, todos.
func (h *Handler) ListarIncidentes(ctx context.Context, request httpapi.ListarIncidentesRequestObject) (httpapi.ListarIncidentesResponseObject, error) {
	incluirInactivos := request.Params.IncluirInactivos != nil && *request.Params.IncluirInactivos

	detalles, err := h.svc.Listar(ctx, incluirInactivos)
	if err != nil {
		return nil, err
	}

	out := make(httpapi.ListarIncidentes200JSONResponse, 0, len(detalles))
	for _, d := range detalles {
		out = append(out, toIncidente(d))
	}
	return out, nil
}

// ObtenerIncidente devuelve un incidente con sus tags, esté activo o no.
func (h *Handler) ObtenerIncidente(ctx context.Context, request httpapi.ObtenerIncidenteRequestObject) (httpapi.ObtenerIncidenteResponseObject, error) {
	d, err := h.svc.Obtener(ctx, request.IncidenteId)
	if err != nil {
		return nil, err
	}

	return httpapi.ObtenerIncidente200JSONResponse(toIncidente(d)), nil
}

// CrearIncidente da de alta un tipo de incidente con los tags de su catálogo.
// Solo llega aquí un admin: lo garantiza middleware.RequireRole con los
// scopes de la ruta.
func (h *Handler) CrearIncidente(ctx context.Context, request httpapi.CrearIncidenteRequestObject) (httpapi.CrearIncidenteResponseObject, error) {
	userID, ok := middleware.UserIDFromContext(ctx)
	if !ok {
		return nil, httperr.ErrNoAutenticado
	}

	d, err := h.svc.Crear(ctx, toNuevoIncidente(request.Body), userID)
	if err != nil {
		return nil, err
	}

	return httpapi.CrearIncidente201JSONResponse(toIncidente(d)), nil
}

// AgregarTags agrega tags al catálogo de un incidente existente. Solo admins,
// igual que CrearIncidente.
func (h *Handler) AgregarTags(ctx context.Context, request httpapi.AgregarTagsRequestObject) (httpapi.AgregarTagsResponseObject, error) {
	userID, ok := middleware.UserIDFromContext(ctx)
	if !ok {
		return nil, httperr.ErrNoAutenticado
	}

	tags, err := h.svc.AgregarTags(ctx, request.IncidenteId, userID, toNuevosTags(*request.Body))
	if err != nil {
		return nil, err
	}

	return httpapi.AgregarTags201JSONResponse(toTagsCatalogo(tags)), nil
}
