package incidente

import (
	"context"
	"strconv"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/db"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/db/sqlc"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/historial"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Store expone las consultas que sqlc genera y añade las operaciones de
// incidentes que necesitan más de una sentencia dentro de una transacción.
type Store struct {
	*sqlc.Queries
	pool *pgxpool.Pool
}

func NewStore(pool *pgxpool.Pool) *Store {
	return &Store{Queries: sqlc.New(pool), pool: pool}
}

// CreateIncidenteConTags inserta el incidente y sus tags en la misma
// transacción: si un tag falla (p. ej. nombre repetido), no queda un
// incidente a medias.
func (s *Store) CreateIncidenteConTags(ctx context.Context, arg CreateTxParams) (Detalle, error) {
	detalle := Detalle{Tags: make([]sqlc.Tag, 0, len(arg.Tags))}

	err := db.ExecTx(ctx, s.pool, func(q *sqlc.Queries) error {
		var err error
		if detalle.Incidente, err = q.CreateIncidente(ctx, arg.Incidente); err != nil {
			return err
		}

		for _, t := range arg.Tags {
			t.IncidenteID = detalle.Incidente.ID
			tag, err := q.CreateTag(ctx, t)
			if err != nil {
				return err
			}
			detalle.Tags = append(detalle.Tags, tag)
		}

		return historial.Registrar(ctx, q, arg.ActorID, "incidente.crear", "incidente", strconv.Itoa(detalle.Incidente.ID),
			map[string]any{"nombre": detalle.Incidente.Nombre, "tags": nombresDeTags(detalle.Tags)})
	})
	if err != nil {
		return Detalle{}, err
	}

	return detalle, nil
}

// CreateTags inserta varios tags del catálogo de un incidente en la misma
// transacción: o se crean todos o ninguno. El IncidenteID de cada tag se
// toma de arg.IncidenteID.
func (s *Store) CreateTags(ctx context.Context, arg CreateTagsTxParams) ([]sqlc.Tag, error) {
	tags := make([]sqlc.Tag, 0, len(arg.Tags))

	err := db.ExecTx(ctx, s.pool, func(q *sqlc.Queries) error {
		for _, t := range arg.Tags {
			t.IncidenteID = arg.IncidenteID
			tag, err := q.CreateTag(ctx, t)
			if err != nil {
				return err
			}
			tags = append(tags, tag)
		}

		return historial.Registrar(ctx, q, arg.ActorID, "incidente.agregar_tags", "incidente", strconv.Itoa(arg.IncidenteID),
			map[string]any{"tags": nombresDeTags(tags)})
	})
	if err != nil {
		return nil, err
	}

	return tags, nil
}

// nombresDeTags devuelve los nombres de los tags, para los datos del historial.
func nombresDeTags(tags []sqlc.Tag) []string {
	nombres := make([]string, 0, len(tags))
	for _, t := range tags {
		nombres = append(nombres, t.Nombre)
	}
	return nombres
}
