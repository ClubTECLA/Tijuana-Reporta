package reporte

import (
	"context"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/db"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/db/sqlc"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/historial"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Store expone las consultas que sqlc genera y añade las operaciones de
// reportes que necesitan más de una sentencia dentro de una transacción.
type Store struct {
	*sqlc.Queries
	pool *pgxpool.Pool
}

func NewStore(pool *pgxpool.Pool) *Store {
	return &Store{Queries: sqlc.New(pool), pool: pool}
}

// CreateReporte inserts and returns a report, saving its initial location
// and association with arg.UserID in the same transaction.
// It returns a zero-value report and propagates errors from starting the
// transaction, inserting any record, or committing the transaction.
func (s *Store) CreateReporte(ctx context.Context, arg CreateTxParams) (sqlc.Reporte, error) {
	var reporte sqlc.Reporte

	err := db.ExecTx(ctx, s.pool, func(q *sqlc.Queries) error {
		var err error
		if reporte, err = q.CreateReporte(ctx, arg.Reporte); err != nil {
			return err
		}

		if _, err = q.CreateLocation(ctx, sqlc.CreateLocationParams{
			ReporteID: reporte.ID,
			UserID:    arg.UserID,
			Latitude:  arg.Latitude,
			Longitude: arg.Longitude,
		}); err != nil {
			return err
		}

		if _, err = q.CreateUserReporte(ctx, sqlc.CreateUserReporteParams{
			UserID:    arg.UserID,
			ReporteID: reporte.ID,
		}); err != nil {
			return err
		}

		return historial.Registrar(ctx, q, arg.UserID, "reporte.crear", "reporte", reporte.ID.String(), nil)
	})
	if err != nil {
		return sqlc.Reporte{}, err
	}

	return reporte, nil
}

// CambiarEstadoReporte actualiza el estado del reporte y registra el cambio
// (estado anterior y nuevo) en el historial, en la misma transacción.
// Devuelve ErrTransicionInvalida si el reporte no puede pasar de su
// estado actual al nuevo (ver ValidarTransicion).
func (s *Store) CambiarEstadoReporte(ctx context.Context, arg CambiarEstadoTxParams) (sqlc.Reporte, error) {
	var reporte sqlc.Reporte

	err := db.ExecTx(ctx, s.pool, func(q *sqlc.Queries) error {
		anterior, err := q.GetEstadoReporteForUpdate(ctx, arg.ID)
		if err != nil {
			return err // pgx.ErrNoRows, lo mapea IsNotFound en el service
		}

		// Se valida con la fila bloqueada para que dos cambios simultáneos no
		// partan los dos del mismo estado anterior.
		if err := ValidarTransicion(anterior, arg.Estado); err != nil {
			return err
		}

		if reporte, err = q.UpdateEstadoReporte(ctx, sqlc.UpdateEstadoReporteParams{
			ID:           arg.ID,
			EstadoActual: arg.Estado,
		}); err != nil {
			return err
		}

		return historial.Registrar(ctx, q, arg.ActorID, "reporte.cambiar_estado", "reporte", arg.ID.String(),
			map[string]string{"de": string(anterior), "a": string(arg.Estado)})
	})
	if err != nil {
		return sqlc.Reporte{}, err
	}

	return reporte, nil
}
