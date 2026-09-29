package database

import (
	"context"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/domain"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Store expone las consultas que sqlc genera a partir de internal/queries
// (por el *domain.Queries embebido) y añade las operaciones que necesitan
// más de una sentencia dentro de una transacción, que sqlc no puede generar.
type Store struct {
	*domain.Queries
	pool *pgxpool.Pool
}

func NewStore(pool *pgxpool.Pool) *Store {
	return &Store{Queries: domain.New(pool), pool: pool}
}

// execTx corre fn dentro de una transacción y hace rollback si devuelve error.
func (s *Store) execTx(ctx context.Context, fn func(*domain.Queries) error) error {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	if err := fn(s.Queries.WithTx(tx)); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

// CreateUserWithLocalProvider inserta el usuario y su proveedor de
// autenticación local en la misma transacción, para que nunca quede un
// usuario sin forma de autenticarse (o un auth_provider huérfano) si una de
// las dos falla.
func (s *Store) CreateUserWithLocalProvider(ctx context.Context, arg domain.CreateUserParams) (domain.User, error) {
	var user domain.User

	err := s.execTx(ctx, func(q *domain.Queries) error {
		var err error
		if user, err = q.CreateUser(ctx, arg); err != nil {
			return err
		}
		return q.CreateLocalAuthProvider(ctx, user.ID)
	})
	if err != nil {
		return domain.User{}, err
	}

	return user, nil
}

// CreateReporte inserta el reporte, la ubicación inicial y sus fotos en la
// misma transacción
func (s *Store) CreateReporte(ctx context.Context, arg domain.CreateReporteTxParams) (domain.Reporte, error) {
	var reporte domain.Reporte

	err := s.execTx(ctx, func(q *domain.Queries) error {
		var err error
		if reporte, err = q.CreateReporte(ctx, arg.Reporte); err != nil {
			return err
		}

		if _, err = q.CreateLocation(ctx, domain.CreateLocationParams{
			ReporteID: reporte.ID,
			UserID:    arg.UserID,
			Latitude:  arg.Latitude,
			Longitude: arg.Longitude,
		}); err != nil {
			return err
		}

		for _, path := range arg.ImagePaths {
			if _, err = q.CreateFotoReporte(ctx, domain.CreateFotoReporteParams{
				ReporteID: reporte.ID,
				ImagePath: path,
				UserID:    arg.UserID,
			}); err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		return domain.Reporte{}, err
	}

	return reporte, nil
}
