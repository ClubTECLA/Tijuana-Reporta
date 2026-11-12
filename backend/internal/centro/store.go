package centro

import (
	"context"
	"strconv"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/db"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/db/sqlc"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/historial"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Store struct {
	*sqlc.Queries
	pool *pgxpool.Pool
}

func NewStore(pool *pgxpool.Pool) *Store {
	return &Store{Queries: sqlc.New(pool), pool: pool}
}

func (s *Store) CreateTipoCentroTx(ctx context.Context, arg CreateTipoCentroTxParams) (sqlc.TiposCentro, error) {
	detalle := sqlc.TiposCentro{}

	err := db.ExecTx(ctx, s.pool, func(q *sqlc.Queries) error {
		var err error
		if detalle, err = q.CreateTipoCentro(ctx, arg.Nombre); err != nil {
			return err
		}

		return historial.Registrar(ctx, q, arg.ActorID, "tipo_centro.crear", "tipo_centro", strconv.Itoa(detalle.ID),
			map[string]any{"nombre": detalle.Nombre})
	})
	if err != nil {
		return sqlc.TiposCentro{}, err
	}

	return detalle, nil
}
