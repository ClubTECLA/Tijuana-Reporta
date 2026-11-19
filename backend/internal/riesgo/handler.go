package riesgo

import (
	"context"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/httpapi"
)

// Handler implementa las operaciones de riesgo del contrato; el servidor lo
// embebe junto con los de las demás funcionalidades.
type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

// ObtenerMapaCalor devuelve el peso de los reportes del área visible,
// agrupado en celdas según el zoom.
func (h *Handler) ObtenerMapaCalor(ctx context.Context, request httpapi.ObtenerMapaCalorRequestObject) (httpapi.ObtenerMapaCalorResponseObject, error) {
	p := request.Params
	mapa, err := h.svc.ObtenerMapaCalor(ctx,
		Area{MinLat: p.MinLat, MaxLat: p.MaxLat, MinLng: p.MinLng, MaxLng: p.MaxLng},
		p.Zoom,
		Filtro{IncidenteIDs: deref(p.IncidenteId), Desde: p.Desde, Hasta: p.Hasta},
	)
	if err != nil {
		return nil, err
	}

	celdas := make([]httpapi.CeldaCalor, 0, len(mapa.Celdas))
	for _, c := range mapa.Celdas {
		celdas = append(celdas, httpapi.CeldaCalor{
			Latitude:  c.Latitude,
			Longitude: c.Longitude,
			Peso:      c.Peso,
			Reportes:  c.Reportes,
		})
	}
	return httpapi.ObtenerMapaCalor200JSONResponse{
		TamanoCeldaM: mapa.TamanoCeldaM,
		PesoMaximo:   mapa.PesoMaximo,
		Celdas:       celdas,
	}, nil
}

// ObtenerResumenRiesgo devuelve las zonas de mayor riesgo, las colonias con
// más incidentes y el conteo por tipo de incidente.
func (h *Handler) ObtenerResumenRiesgo(ctx context.Context, request httpapi.ObtenerResumenRiesgoRequestObject) (httpapi.ObtenerResumenRiesgoResponseObject, error) {
	p := request.Params
	r, err := h.svc.ObtenerResumen(ctx, Filtro{
		IncidenteIDs: deref(p.IncidenteId),
		Desde:        p.Desde,
		Hasta:        p.Hasta,
	})
	if err != nil {
		return nil, err
	}

	zonas := make([]httpapi.ZonaRiesgo, 0, len(r.Zonas))
	for _, z := range r.Zonas {
		zonas = append(zonas, httpapi.ZonaRiesgo{
			Nombre:    z.Nombre,
			Latitude:  z.Latitude,
			Longitude: z.Longitude,
			RadioM:    z.RadioM,
			Score:     z.Score,
			Nivel:     httpapi.NivelRiesgo(z.Nivel),
			Reportes:  z.Reportes,
		})
	}
	colonias := make([]httpapi.ColoniaRiesgo, 0, len(r.Colonias))
	for _, c := range r.Colonias {
		colonias = append(colonias, httpapi.ColoniaRiesgo{
			Nombre:   c.Nombre,
			Reportes: c.Reportes,
			Score:    c.Score,
			Nivel:    httpapi.NivelRiesgo(c.Nivel),
		})
	}
	categorias := make([]httpapi.ConteoCategoria, 0, len(r.Categorias))
	for _, c := range r.Categorias {
		categorias = append(categorias, httpapi.ConteoCategoria{IncidenteId: c.IncidenteID, Total: c.Total})
	}

	return httpapi.ObtenerResumenRiesgo200JSONResponse{
		GeneradoEn:      r.GeneradoEn,
		VersionModelo:   r.VersionModelo,
		TotalHistoricos: r.TotalHistoricos,
		ZonasAltoRiesgo: r.ZonasAltoRiesgo,
		Zonas:           zonas,
		Colonias:        colonias,
		Categorias:      categorias,
	}, nil
}

func deref(ids *[]int) []int {
	if ids == nil {
		return nil
	}
	return *ids
}
