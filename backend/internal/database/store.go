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

// CreateIncidenteConTags inserta el incidente y sus tags en la misma
// transacción: si un tag falla (p. ej. nombre repetido), no queda un
// incidente a medias.
func (s *Store) CreateIncidenteConTags(ctx context.Context, arg domain.CreateIncidenteTxParams) (domain.IncidenteDetalle, error) {
	detalle := domain.IncidenteDetalle{Tags: make([]domain.Tag, 0, len(arg.Tags))}

	err := s.execTx(ctx, func(q *domain.Queries) error {
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
		return nil
	})
	if err != nil {
		return domain.IncidenteDetalle{}, err
	}

	return detalle, nil
}

// CreateTags inserta varios tags del catálogo de un incidente en la misma
// transacción: o se crean todos o ninguno. Los IncidenteID de arg ya deben
// venir llenos.
func (s *Store) CreateTags(ctx context.Context, arg []domain.CreateTagParams) ([]domain.Tag, error) {
	tags := make([]domain.Tag, 0, len(arg))

	err := s.execTx(ctx, func(q *domain.Queries) error {
		for _, t := range arg {
			tag, err := q.CreateTag(ctx, t)
			if err != nil {
				return err
			}
			tags = append(tags, tag)
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	return tags, nil
}
