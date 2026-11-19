package riesgo

import (
	"context"
	"time"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/db/sqlc"
)

// store declara solo las consultas que usa el servicio, con las firmas
// exactas de sqlc; *sqlc.Queries la cumple sin adaptadores.
type store interface {
	ListCeldasCalor(ctx context.Context, arg sqlc.ListCeldasCalorParams) ([]sqlc.ListCeldasCalorRow, error)
	ListZonasRiesgo(ctx context.Context, arg sqlc.ListZonasRiesgoParams) ([]sqlc.ListZonasRiesgoRow, error)
	ListColoniasHistorico(ctx context.Context, arg sqlc.ListColoniasHistoricoParams) ([]sqlc.ListColoniasHistoricoRow, error)
	ListConteoCategorias(ctx context.Context, arg sqlc.ListConteoCategoriasParams) ([]sqlc.ListConteoCategoriasRow, error)
}

type Service struct {
	store store
	ahora func() time.Time
}

func NewService(store store) *Service {
	return &Service{store: store, ahora: time.Now}
}

// ObtenerMapaCalor agrupa el peso de los reportes históricos del área en
// celdas cuyo tamaño depende del zoom.
func (s *Service) ObtenerMapaCalor(ctx context.Context, area Area, zoom float64, filtro Filtro) (MapaCalor, error) {
	if area.MinLat > area.MaxLat || area.MinLng > area.MaxLng {
		return MapaCalor{}, ErrAreaInvalida
	}
	if err := validarFiltro(filtro); err != nil {
		return MapaCalor{}, err
	}

	tamano := TamanoCelda(zoom)
	filas, err := s.store.ListCeldasCalor(ctx, sqlc.ListCeldasCalorParams{
		TamanoCeldaM: tamano,
		MinLng:       area.MinLng,
		MinLat:       area.MinLat,
		MaxLng:       area.MaxLng,
		MaxLat:       area.MaxLat,
		IncidenteIds: idsONil(filtro.IncidenteIDs),
		Desde:        filtro.Desde,
		Hasta:        filtro.Hasta,
	})
	if err != nil {
		return MapaCalor{}, err
	}

	mapa := MapaCalor{TamanoCeldaM: tamano, Celdas: make([]CeldaCalor, 0, len(filas))}
	for _, f := range filas {
		mapa.Celdas = append(mapa.Celdas, CeldaCalor{
			Latitude:  f.Latitude,
			Longitude: f.Longitude,
			Peso:      f.Peso,
			Reportes:  f.Reportes,
		})
		if f.Peso > mapa.PesoMaximo {
			mapa.PesoMaximo = f.Peso
		}
	}
	return mapa, nil
}

// ObtenerResumen arma las zonas, las colonias y el conteo por categoría de
// toda la ciudad.
func (s *Service) ObtenerResumen(ctx context.Context, filtro Filtro) (Resumen, error) {
	if err := validarFiltro(filtro); err != nil {
		return Resumen{}, err
	}
	ids := idsONil(filtro.IncidenteIDs)

	filasZonas, err := s.store.ListZonasRiesgo(ctx, sqlc.ListZonasRiesgoParams{
		Limite:       LimiteZonas,
		IncidenteIds: ids,
		Desde:        filtro.Desde,
		Hasta:        filtro.Hasta,
		EpsM:         EpsM,
		MinPuntos:    MinPuntos,
	})
	if err != nil {
		return Resumen{}, err
	}
	filasColonias, err := s.store.ListColoniasHistorico(ctx, sqlc.ListColoniasHistoricoParams{
		IncidenteIds: ids,
		Desde:        filtro.Desde,
		Hasta:        filtro.Hasta,
		Limite:       LimiteColonias,
	})
	if err != nil {
		return Resumen{}, err
	}
	filasCategorias, err := s.store.ListConteoCategorias(ctx, sqlc.ListConteoCategoriasParams{
		IncidenteIds: ids,
		Desde:        filtro.Desde,
		Hasta:        filtro.Hasta,
	})
	if err != nil {
		return Resumen{}, err
	}

	r := Resumen{
		GeneradoEn:    s.ahora(),
		VersionModelo: VersionModelo,
		Zonas:         make([]ZonaRiesgo, 0, len(filasZonas)),
		Colonias:      make([]ColoniaRiesgo, 0, len(filasColonias)),
		Categorias:    make([]ConteoCategoria, 0, len(filasCategorias)),
	}

	maxZona := 0.0
	for _, z := range filasZonas {
		if z.Peso > maxZona {
			maxZona = z.Peso
		}
	}
	for _, z := range filasZonas {
		score := Score(z.Peso, maxZona)
		zona := ZonaRiesgo{
			Nombre:    NombreZona(z.Colonia),
			Latitude:  z.Latitude,
			Longitude: z.Longitude,
			RadioM:    z.RadioM,
			Score:     score,
			Nivel:     NivelDe(score),
			Reportes:  z.Reportes,
		}
		if zona.Nivel == NivelAlto {
			r.ZonasAltoRiesgo++
		}
		r.Zonas = append(r.Zonas, zona)
	}

	maxColonia := 0.0
	for _, c := range filasColonias {
		if c.Peso > maxColonia {
			maxColonia = c.Peso
		}
	}
	for _, c := range filasColonias {
		score := Score(c.Peso, maxColonia)
		r.Colonias = append(r.Colonias, ColoniaRiesgo{
			Nombre:   c.Colonia,
			Reportes: c.Reportes,
			Score:    score,
			Nivel:    NivelDe(score),
		})
	}

	for _, c := range filasCategorias {
		r.Categorias = append(r.Categorias, ConteoCategoria{IncidenteID: c.IncidenteID, Total: c.Total})
		r.TotalHistoricos += c.Total
	}
	return r, nil
}

func validarFiltro(f Filtro) error {
	if f.Desde != nil && f.Hasta != nil && f.Desde.After(*f.Hasta) {
		return ErrPeriodoInvalido
	}
	return nil
}

// idsONil convierte una lista vacía en nil: en las consultas, NULL significa
// "sin filtro", mientras que un arreglo vacío no dejaría pasar nada.
func idsONil(ids []int) []int {
	if len(ids) == 0 {
		return nil
	}
	return ids
}
