package domain

import (
	"slices"

	"github.com/google/uuid"
)

// Archivo escrito a mano: convive con el código generado por sqlc, que solo
// reescribe models.go, querier.go, db.go y los *.sql.go.

// CreateReporteTxParams agrupa todo lo que se inserta al crear un reporte:
// el reporte en sí y la ubicación inicial. No se llama CreateReporteParams
// porque ese nombre ya lo usa sqlc para el INSERT simple.
type CreateReporteTxParams struct {
	Reporte   CreateReporteParams
	UserID    uuid.UUID
	Latitude  float64
	Longitude float64
}

// TituloReporte arma el título que se muestra de un reporte: no se almacena,
// se deriva de la etiqueta de su incidente y de su dirección, si la tiene.
func TituloReporte(etiquetaIncidente string, direccion *string) string {
	if direccion == nil {
		return etiquetaIncidente
	}
	return etiquetaIncidente + " en " + *direccion
}

// transiciones dice a qué estados puede pasar un reporte desde cada estado.
// Los estados solo avanzan (Pendiente → Probable → Verificado → Resuelto) y
// se pueden saltar pasos; Descartado se alcanza desde cualquier estado no
// final. Resuelto y Descartado son finales: no tienen salida.
var transiciones = map[Estado][]Estado{
	EstadoPendiente:  {EstadoProbable, EstadoVerificado, EstadoResuelto, EstadoDescartado},
	EstadoProbable:   {EstadoVerificado, EstadoResuelto, EstadoDescartado},
	EstadoVerificado: {EstadoResuelto, EstadoDescartado},
	EstadoResuelto:   {},
	EstadoDescartado: {},
}

// EstadoValido reporta si e es uno de los valores del enum estado.
func EstadoValido(e Estado) bool {
	_, ok := transiciones[e]
	return ok
}

// ValidarTransicion devuelve ErrTransicionInvalida si un reporte no puede
// pasar del estado de al estado a, incluido quedarse en el mismo estado.
func ValidarTransicion(de, a Estado) error {
	if !slices.Contains(transiciones[de], a) {
		return ErrTransicionInvalida
	}
	return nil
}

// ReporteDetalle agrupa el reporte con todo lo que depende de este.
type ReporteDetalle struct {
	Reporte     Reporte
	Titulo      string
	Latitude    float64
	Longitude   float64
	Comentarios []ComentarioConAutor
	Multimedia  []Multimedia
	Tags        []TagConteo
	Locations   []Location
}

// TagConteo es un tag del reporte junto con cuántas veces se ha confirmado.
type TagConteo struct {
	ID     int
	Nombre string
	Count  int
}

// ReporteResumen es lo que se muestra de un reporte en una lista o en el
// mapa: sin comentarios, multimedia ni tags.
type ReporteResumen struct {
	ID            uuid.UUID
	IncidenteID   int
	Titulo        string
	Direccion     *string
	EstadoActual  Estado
	Avistamientos int
	EsOficial     bool
	Latitude      float64
	Longitude     float64
}

// ReporteCercano es el resumen de un reporte junto con su distancia, en
// metros, al punto de la búsqueda.
type ReporteCercano struct {
	ReporteResumen
	DistanciaM float64
}

type NuevoReporte struct {
	UserID      uuid.UUID
	Rol         string
	IncidenteID int
	Latitude    float64
	Longitude   float64
	EsOficial   bool
	Direccion   *string
}

// CambiarEstadoReporteTxParams es lo que necesita el cambio de estado de un
// reporte: el reporte, su nuevo estado y quién lo cambia, para el historial.
type CambiarEstadoReporteTxParams struct {
	ID      uuid.UUID
	Estado  Estado
	ActorID uuid.UUID
}
