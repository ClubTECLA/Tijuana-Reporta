package centro

import (
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/db/sqlc"
	"github.com/google/uuid"
)

type NuevoTipoCentro struct {
	Nombre string
}

// Centro es la fila de centros sin geom. Es el mismo struct que devuelven
// las consultas de sqlc, para poder convertirlas con Centro(row).
type Centro = sqlc.CreateCentroRow

type NuevoCentro struct {
	TipoCentro  int
	Nombre      string
	Descripcion *string
	Latitude    float64
	Longitude   float64
	Capacidad   *int
	Cantidad    *int
	Activo      *bool
}

type CreateTipoCentroTxParams struct {
	Nombre  string
	ActorID uuid.UUID
}

type CreateCentroTxParams struct {
	Centro  sqlc.CreateCentroParams
	ActorID uuid.UUID
}
