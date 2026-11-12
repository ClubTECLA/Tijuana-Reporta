package centro

import "github.com/google/uuid"

type NuevoTipoCentro struct {
	Nombre string
}

type CreateTipoCentroTxParams struct {
	Nombre  string
	ActorID uuid.UUID
}
