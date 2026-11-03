// Package historial guarda quién hizo qué y sobre qué entidad. Las demás
// funcionalidades llaman a Registrar dentro de sus transacciones; este
// paquete no importa a ninguna de ellas.
package historial

import (
	"context"
	"encoding/json"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/db/sqlc"
	"github.com/google/uuid"
)

// Registrar agrega un evento al historial con la q de la transacción en
// curso, para que el evento y el cambio que describe se guarden o se
// descarten juntos. datos se guarda como JSON; nil deja la columna en NULL.
func Registrar(ctx context.Context, q *sqlc.Queries, actorID uuid.UUID, accion, entidad, entidadID string, datos any) error {
	var raw []byte
	if datos != nil {
		var err error
		if raw, err = json.Marshal(datos); err != nil {
			return err
		}
	}
	return q.CreateHistorialEvento(ctx, sqlc.CreateHistorialEventoParams{
		ActorID:   &actorID,
		Accion:    accion,
		Entidad:   entidad,
		EntidadID: entidadID,
		Datos:     raw,
	})
}
