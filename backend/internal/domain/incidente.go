package domain

// Archivo escrito a mano: convive con el código generado por sqlc, que solo
// reescribe models.go, querier.go, db.go y los *.sql.go.

// NuevoIncidente es lo que pide el servicio para dar de alta un incidente,
// tal como llega del cliente: los opcionales son nil si no se mandaron, y el
// servicio les pone su valor por defecto.
type NuevoIncidente struct {
	Nombre       string
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

// CreateIncidenteTxParams agrupa el incidente y sus tags para crearlos en la
// misma transacción. El IncidenteID de cada tag se llena dentro de la
// transacción, una vez que existe el incidente.
type CreateIncidenteTxParams struct {
	Incidente CreateIncidenteParams
	Tags      []CreateTagParams
}

// IncidenteDetalle agrupa el incidente con los tags de su catálogo.
type IncidenteDetalle struct {
	Incidente Incidente
	Tags      []Tag
}
