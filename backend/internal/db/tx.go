package db

import (
	"context"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/db/sqlc"
	"github.com/jackc/pgx/v5/pgxpool"
)

// ExecTx corre fn dentro de una transacción y hace rollback si devuelve error.
// Las operaciones de varias sentencias, que sqlc no puede generar, la usan
// para que todo lo que escriben se guarde o se descarte junto.
func ExecTx(ctx context.Context, pool *pgxpool.Pool, fn func(*sqlc.Queries) error) error {
	tx, err := pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	if err := fn(sqlc.New(tx)); err != nil {
		return err
	}
	return tx.Commit(ctx)
}
