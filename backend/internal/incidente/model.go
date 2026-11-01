package incidente

import (
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/db/sqlc"
	"github.com/google/uuid"
)

// Nuevo es lo que pide el servicio para dar de alta un incidente,
// tal como llega del cliente: los opcionales son nil si no se mandaron, y el
// servicio les pone su valor por defecto.
type Nuevo struct {
	Nombre       string
	Etiqueta     *string
	Color        *string
	EstaActivo   *bool
	TiempoLimite *int
	Radio        *float64
	Tags         []NuevoTag
}

// NuevoTag es un tag del catálogo que se crea junto con su incidente.
type NuevoTag struct {
	Nombre string
	Peso   *int
}

// CreateTxParams agrupa el incidente y sus tags para crearlos en la
// misma transacción. El IncidenteID de cada tag se llena dentro de la
// transacción, una vez que existe el incidente.
type CreateTxParams struct {
	Incidente sqlc.CreateIncidenteParams
	Tags      []sqlc.CreateTagParams
	ActorID   uuid.UUID
}

// Detalle agrupa el incidente con los tags de su catálogo.
type Detalle struct {
	Incidente sqlc.Incidente
	Tags      []sqlc.Tag
}

// CreateTagsTxParams agrupa los tags que se agregan al catálogo de un
// incidente existente y quién los agrega, para el historial.
type CreateTagsTxParams struct {
	IncidenteID int
	Tags        []sqlc.CreateTagParams
	ActorID     uuid.UUID
}
