package comentario

import (
	"context"
	"strconv"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/db"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/db/sqlc"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/historial"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Store expone las consultas que sqlc genera y añade las operaciones de
// comentarios que necesitan más de una sentencia dentro de una transacción.
type Store struct {
	*sqlc.Queries
	pool *pgxpool.Pool
}

func NewStore(pool *pgxpool.Pool) *Store {
	return &Store{Queries: sqlc.New(pool), pool: pool}
}

// CreateComentario inserta el comentario y lo registra en el historial en la
// misma transacción. Tapa al CreateComentario de sqlc con la misma firma, así
// que el servicio no cambia.
func (s *Store) CreateComentario(ctx context.Context, arg sqlc.CreateComentarioParams) (sqlc.CreateComentarioRow, error) {
	var row sqlc.CreateComentarioRow

	err := db.ExecTx(ctx, s.pool, func(q *sqlc.Queries) error {
		var err error
		if row, err = q.CreateComentario(ctx, arg); err != nil {
			return err
		}

		return historial.Registrar(ctx, q, arg.UserID, "comentario.crear", "comentario", strconv.Itoa(row.ID),
			map[string]string{"reporte_id": arg.ReporteID.String()})
	})
	if err != nil {
		return sqlc.CreateComentarioRow{}, err
	}

	return row, nil
}
