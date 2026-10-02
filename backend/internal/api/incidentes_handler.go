package api

import (
	"context"
	"errors"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/domain"
)

// toTagsCatalogo convierte tags del dominio en los TagCatalogo del contrato.
// Siempre devuelve un slice (nunca nil) para que el JSON lleve [] y no null,
// como pide el contrato.
func toTagsCatalogo(tags []domain.Tag) []TagCatalogo {
	out := make([]TagCatalogo, 0, len(tags))
	for _, t := range tags {
		out = append(out, TagCatalogo{Id: t.ID, Nombre: t.Nombre, Peso: t.Peso})
	}
	return out
}

// toIncidente convierte un domain.IncidenteDetalle en el Incidente del
// contrato.
func toIncidente(d domain.IncidenteDetalle) Incidente {
	return Incidente{
		Color:        d.Incidente.Color,
		EstaActivo:   d.Incidente.EstaActivo,
		Id:           d.Incidente.ID,
		Nombre:       d.Incidente.Nombre,
		Radio:        d.Incidente.Radio,
		Tags:         toTagsCatalogo(d.Tags),
		TiempoLimite: d.Incidente.TiempoLimite,
	}
}

// toNuevosTags convierte los tags de la petición en lo que pide el servicio.
func toNuevosTags(tags []CrearTagRequest) []domain.NuevoTag {
	out := make([]domain.NuevoTag, 0, len(tags))
	for _, t := range tags {
		out = append(out, domain.NuevoTag{Nombre: t.Nombre, Peso: t.Peso})
	}
	return out
}

// toNuevoIncidente convierte el body de la petición en lo que pide el
// servicio. Los opcionales se pasan tal cual (nil si no se mandaron): los
// valores por defecto los pone el servicio.
func toNuevoIncidente(b *CrearIncidenteRequest) domain.NuevoIncidente {
	nuevo := domain.NuevoIncidente{
		Nombre:       b.Nombre,
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
func (s *Server) ListarIncidentes(ctx context.Context, request ListarIncidentesRequestObject) (ListarIncidentesResponseObject, error) {
	incluirInactivos := request.Params.IncluirInactivos != nil && *request.Params.IncluirInactivos

	detalles, err := s.services.Incidentes.Listar(ctx, incluirInactivos)
	if err != nil {
		return nil, err
	}

	out := make(ListarIncidentes200JSONResponse, 0, len(detalles))
	for _, d := range detalles {
		out = append(out, toIncidente(d))
	}
	return out, nil
}

// ObtenerIncidente devuelve un incidente con sus tags, esté activo o no.
func (s *Server) ObtenerIncidente(ctx context.Context, request ObtenerIncidenteRequestObject) (ObtenerIncidenteResponseObject, error) {
	d, err := s.services.Incidentes.Obtener(ctx, request.IncidenteId)
	if err != nil {
		if errors.Is(err, domain.ErrIncidenteNotFound) {
			return ObtenerIncidente404JSONResponse{Message: "incidente no encontrado"}, nil
		}
		return nil, err
	}

	return ObtenerIncidente200JSONResponse(toIncidente(d)), nil
}

// CrearIncidente da de alta un tipo de incidente con los tags de su catálogo.
// Solo llega aquí un admin: lo garantiza middleware.RequireRole con los
// scopes de la ruta.
func (s *Server) CrearIncidente(ctx context.Context, request CrearIncidenteRequestObject) (CrearIncidenteResponseObject, error) {
	d, err := s.services.Incidentes.Crear(ctx, toNuevoIncidente(request.Body))
	if err != nil {
		if errors.Is(err, domain.ErrIncidenteInvalido) {
			return CrearIncidente400JSONResponse{Message: err.Error()}, nil
		}
		if errors.Is(err, domain.ErrIncidenteNameTaken) {
			return CrearIncidente409JSONResponse{Message: "ya existe un incidente con ese nombre"}, nil
		}
		return nil, err
	}

	return CrearIncidente201JSONResponse(toIncidente(d)), nil
}

// AgregarTags agrega tags al catálogo de un incidente existente. Solo admins,
// igual que CrearIncidente.
func (s *Server) AgregarTags(ctx context.Context, request AgregarTagsRequestObject) (AgregarTagsResponseObject, error) {
	tags, err := s.services.Incidentes.AgregarTags(ctx, request.IncidenteId, toNuevosTags(*request.Body))
	if err != nil {
		if errors.Is(err, domain.ErrIncidenteInvalido) {
			return AgregarTags400JSONResponse{Message: err.Error()}, nil
		}
		if errors.Is(err, domain.ErrIncidenteNotFound) {
			return AgregarTags404JSONResponse{Message: "incidente no encontrado"}, nil
		}
		if errors.Is(err, domain.ErrTagNameTaken) {
			return AgregarTags409JSONResponse{Message: "el incidente ya tiene un tag con ese nombre"}, nil
		}
		return nil, err
	}

	return AgregarTags201JSONResponse(toTagsCatalogo(tags)), nil
}
