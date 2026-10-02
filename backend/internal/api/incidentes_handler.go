package api

import (
	"context"
	"errors"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/domain"
)

// toIncidente convierte un domain.IncidenteDetalle en el Incidente del
// contrato. Tags siempre es un slice (nunca nil) para que el JSON lleve []
// y no null, como pide el contrato.
func toIncidente(d domain.IncidenteDetalle) Incidente {
	tags := make([]TagCatalogo, 0, len(d.Tags))
	for _, t := range d.Tags {
		tags = append(tags, TagCatalogo{Id: t.ID, Nombre: t.Nombre, Peso: t.Peso})
	}

	return Incidente{
		Color:        d.Incidente.Color,
		EstaActivo:   d.Incidente.EstaActivo,
		Id:           d.Incidente.ID,
		Nombre:       d.Incidente.Nombre,
		Radio:        d.Incidente.Radio,
		Tags:         tags,
		TiempoLimite: d.Incidente.TiempoLimite,
	}
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
		nuevo.Tags = make([]domain.NuevoTag, 0, len(*b.Tags))
		for _, t := range *b.Tags {
			nuevo.Tags = append(nuevo.Tags, domain.NuevoTag{Nombre: t.Nombre, Peso: t.Peso})
		}
	}
	return nuevo
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
