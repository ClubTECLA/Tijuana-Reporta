package riesgo

import (
	"math"
	"time"
)

// Parámetros del modelo de riesgo (ver backend/GUIA_RIESGO.md). Cambiar
// cualquiera de ellos, o la fórmula de peso de la vista
// reporte_historico_peso, es una versión nueva del modelo: subir
// VersionModelo.
const (
	VersionModelo = 1

	// Zonas (DBSCAN): un reporte forma zona si tiene al menos MinPuntos
	// reportes (contándose) a menos de EpsM metros. Calibrado con los datos
	// reales: 500 m / 4 da zonas del tamaño de una colonia sin encadenarlas.
	EpsM      = 500.0
	MinPuntos = 4

	LimiteZonas    = 20
	LimiteColonias = 10

	// Umbrales del score (peso / mayor peso del resultado).
	UmbralAlto  = 0.66
	UmbralMedio = 0.33

	// Celda del mapa de calor: unos PixelesPorCelda en pantalla, limitada
	// entre CeldaMinM y CeldaMaxM metros.
	PixelesPorCelda = 32.0
	CeldaMinM       = 50.0
	CeldaMaxM       = 5000.0
	// Metros por píxel en zoom 0 a la latitud de Tijuana (≈ 32.5° N):
	// 156 543.03 × cos(32.5°).
	metrosPorPixelZoom0 = 132030.0

	NombreZonaSinColonia = "Zona sin colonia"
)

// Nivel de riesgo derivado del score.
type Nivel string

const (
	NivelAlto  Nivel = "Alto"
	NivelMedio Nivel = "Medio"
	NivelBajo  Nivel = "Bajo"
)

// Filtro común a todas las consultas. IncidenteIDs vacío = todos los tipos;
// Desde/Hasta nil = sin límite.
type Filtro struct {
	IncidenteIDs []int
	Desde        *time.Time
	Hasta        *time.Time
}

// Area visible del mapa, en grados.
type Area struct {
	MinLat, MaxLat float64
	MinLng, MaxLng float64
}

type CeldaCalor struct {
	Latitude  float64
	Longitude float64
	Peso      float64
	Reportes  int
}

type MapaCalor struct {
	TamanoCeldaM float64
	PesoMaximo   float64
	Celdas       []CeldaCalor
}

type ZonaRiesgo struct {
	Nombre    string
	Latitude  float64
	Longitude float64
	RadioM    float64
	Score     float64
	Nivel     Nivel
	Reportes  int
}

type ColoniaRiesgo struct {
	Nombre   string
	Reportes int
	Score    float64
	Nivel    Nivel
}

type ConteoCategoria struct {
	IncidenteID int
	Total       int
}

type Resumen struct {
	GeneradoEn      time.Time
	VersionModelo   int
	TotalHistoricos int
	ZonasAltoRiesgo int
	Zonas           []ZonaRiesgo
	Colonias        []ColoniaRiesgo
	Categorias      []ConteoCategoria
}

// TamanoCelda devuelve el lado de la celda en metros para un zoom: unos
// PixelesPorCelda en pantalla, limitado a [CeldaMinM, CeldaMaxM].
func TamanoCelda(zoom float64) float64 {
	m := metrosPorPixelZoom0 / math.Pow(2, zoom) * PixelesPorCelda
	return math.Min(CeldaMaxM, math.Max(CeldaMinM, m))
}

// Score normaliza un peso contra el mayor peso del resultado (0..1),
// redondeado a 4 decimales: así 6.6/10 da 0.66 exacto (y no 0.6599…, que
// caería bajo el umbral) y el JSON no lleva ruido de punto flotante.
func Score(peso, pesoMaximo float64) float64 {
	if pesoMaximo <= 0 || peso <= 0 {
		return 0
	}
	return math.Round(math.Min(1, peso/pesoMaximo)*1e4) / 1e4
}

// NivelDe convierte un score en nivel.
func NivelDe(score float64) Nivel {
	switch {
	case score >= UmbralAlto:
		return NivelAlto
	case score >= UmbralMedio:
		return NivelMedio
	default:
		return NivelBajo
	}
}

// NombreZona usa la colonia más frecuente de la zona, o un nombre genérico
// si ningún reporte tiene colonia.
func NombreZona(colonia string) string {
	if colonia == "" {
		return NombreZonaSinColonia
	}
	return colonia
}
