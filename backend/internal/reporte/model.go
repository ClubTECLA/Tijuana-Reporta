package reporte

import (
	"slices"
	"time"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/db/sqlc"
	"github.com/google/uuid"
)

// CreateTxParams agrupa todo lo que se inserta al crear un reporte:
// el reporte en sí y la ubicación inicial. No se llama CreateReporteParams
// porque ese nombre ya lo usa sqlc para el INSERT simple.
type CreateTxParams struct {
	Reporte   sqlc.CreateReporteParams
	UserID    uuid.UUID
	Latitude  float64
	Longitude float64
}

// Titulo arma el título que se muestra de un reporte: no se almacena,
// se deriva de la etiqueta de su incidente y de su dirección, si la tiene.
func Titulo(etiquetaIncidente string, direccion *string) string {
	if direccion == nil {
		return etiquetaIncidente
	}
	return etiquetaIncidente + " en " + *direccion
}

// RolCiudadano es el rol por defecto de los usuarios registrados (tabla roles).
const RolCiudadano = "ciudadano"

// PuedeGestionar reporta si el rol puede gestionar reportes: crearlos como
// oficiales y cambiarles el estado. Puede cualquier rol menos ciudadano. Se
// compara contra ciudadano (y no contra una lista de roles permitidos) para
// que un rol nuevo en la tabla roles quede permitido sin tocar este código.
// Un rol vacío (token anterior al claim "rol") cuenta como ciudadano.
func PuedeGestionar(rol string) bool {
	return rol != "" && rol != RolCiudadano
}

// transiciones dice a qué estados puede pasar un reporte desde cada estado.
// Los estados solo avanzan (Pendiente → Probable → Verificado → Resuelto) y
// se pueden saltar pasos; Descartado se alcanza desde cualquier estado no
// final. Resuelto y Descartado son finales: no tienen salida.
var transiciones = map[sqlc.Estado][]sqlc.Estado{
	sqlc.EstadoPendiente:  {sqlc.EstadoProbable, sqlc.EstadoVerificado, sqlc.EstadoResuelto, sqlc.EstadoDescartado},
	sqlc.EstadoProbable:   {sqlc.EstadoVerificado, sqlc.EstadoResuelto, sqlc.EstadoDescartado},
	sqlc.EstadoVerificado: {sqlc.EstadoResuelto, sqlc.EstadoDescartado},
	sqlc.EstadoResuelto:   {},
	sqlc.EstadoDescartado: {},
}

// EstadoValido reporta si e es uno de los valores del enum estado.
func EstadoValido(e sqlc.Estado) bool {
	_, ok := transiciones[e]
	return ok
}

// ValidarTransicion devuelve ErrTransicionInvalida si un reporte no puede
// pasar del estado de al estado a, incluido quedarse en el mismo estado.
func ValidarTransicion(de, a sqlc.Estado) error {
	if !slices.Contains(transiciones[de], a) {
		return ErrTransicionInvalida
	}
	return nil
}

// Detalle agrupa el reporte con todo lo que depende de este.
type Detalle struct {
	Reporte     sqlc.Reporte
	Titulo      string
	Latitude    float64
	Longitude   float64
	Comentarios []Comentario
	Multimedia  []sqlc.Multimedia
	Tags        []TagConteo
	Locations   []sqlc.Location
}

// Comentario es un comentario del reporte junto con el username y el nombre
// del rol de su autor, ya resueltos contra las tablas users y roles.
type Comentario struct {
	ID         int
	ReporteID  uuid.UUID
	UserID     uuid.UUID
	Comentario string
	CreatedAt  time.Time
	Username   string
	RolName    string
}

// TagConteo es un tag del reporte junto con cuántas veces se ha confirmado.
type TagConteo struct {
	ID     int
	Nombre string
	Count  int
}

// Resumen es lo que se muestra de un reporte en una lista o en el
// mapa: sin comentarios, multimedia ni tags.
type Resumen struct {
	ID            uuid.UUID
	IncidenteID   int
	Titulo        string
	Direccion     *string
	EstadoActual  sqlc.Estado
	Avistamientos int
	EsOficial     bool
	Latitude      float64
	Longitude     float64
}

// Cercano es el resumen de un reporte junto con su distancia, en
// metros, al punto de la búsqueda.
type Cercano struct {
	Resumen
	DistanciaM float64
}

type Nuevo struct {
	UserID      uuid.UUID
	Rol         string
	IncidenteID int
	Latitude    float64
	Longitude   float64
	EsOficial   bool
	Direccion   *string
}

// CambiarEstadoTxParams es lo que necesita el cambio de estado de un
// reporte: el reporte, su nuevo estado y quién lo cambia, para el historial.
type CambiarEstadoTxParams struct {
	ID      uuid.UUID
	Estado  sqlc.Estado
	ActorID uuid.UUID
}
