package database

import (
	"context"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/db"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/db/sqlc"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/historial"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Store expone las consultas que sqlc genera a partir de internal/queries
// (por el *sqlc.Queries embebido) y añade las operaciones que necesitan
// más de una sentencia dentro de una transacción, que sqlc no puede generar.
type Store struct {
	*sqlc.Queries
	pool *pgxpool.Pool
}

func NewStore(pool *pgxpool.Pool) *Store {
	return &Store{Queries: sqlc.New(pool), pool: pool}
}

// execTx corre fn dentro de una transacción del pool del store (ver db.ExecTx).
func (s *Store) execTx(ctx context.Context, fn func(*sqlc.Queries) error) error {
	return db.ExecTx(ctx, s.pool, fn)
}

// CreateUserWithLocalProvider inserta el usuario y su proveedor de
// autenticación local en la misma transacción, para que nunca quede un
// usuario sin forma de autenticarse (o un auth_provider huérfano) si una de
// las dos falla.
func (s *Store) CreateUserWithLocalProvider(ctx context.Context, arg sqlc.CreateUserParams) (sqlc.User, error) {
	var user sqlc.User

	err := s.execTx(ctx, func(q *sqlc.Queries) error {
		var err error
		if user, err = q.CreateUser(ctx, arg); err != nil {
			return err
		}
		if err = q.CreateLocalAuthProvider(ctx, user.ID); err != nil {
			return err
		}
		// El actor es el propio usuario: se registra a sí mismo.
		return historial.Registrar(ctx, q, user.ID, "usuario.registrar", "usuario", user.ID.String(), nil)
	})
	if err != nil {
		return sqlc.User{}, err
	}

	return user, nil
}
