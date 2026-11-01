package database

import (
	"context"
	"strconv"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/db"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/db/sqlc"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/domain"
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

// CreateIncidenteConTags inserta el incidente y sus tags en la misma
// transacción: si un tag falla (p. ej. nombre repetido), no queda un
// incidente a medias.
func (s *Store) CreateIncidenteConTags(ctx context.Context, arg domain.CreateIncidenteTxParams) (domain.IncidenteDetalle, error) {
	detalle := domain.IncidenteDetalle{Tags: make([]sqlc.Tag, 0, len(arg.Tags))}

	err := s.execTx(ctx, func(q *sqlc.Queries) error {
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
		return domain.IncidenteDetalle{}, err
	}

	return detalle, nil
}

// CreateTags inserta varios tags del catálogo de un incidente en la misma
// transacción: o se crean todos o ninguno. El IncidenteID de cada tag se
// toma de arg.IncidenteID.
func (s *Store) CreateTags(ctx context.Context, arg domain.CreateTagsTxParams) ([]sqlc.Tag, error) {
	tags := make([]sqlc.Tag, 0, len(arg.Tags))

	err := s.execTx(ctx, func(q *sqlc.Queries) error {
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

// CreateComentario inserta el comentario y lo registra en el historial en la
// misma transacción. Tapa al CreateComentario de sqlc con la misma firma, así
// que el servicio no cambia.
func (s *Store) CreateComentario(ctx context.Context, arg sqlc.CreateComentarioParams) (sqlc.CreateComentarioRow, error) {
	var row sqlc.CreateComentarioRow

	err := s.execTx(ctx, func(q *sqlc.Queries) error {
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

// nombresDeTags devuelve los nombres de los tags, para los datos del historial.
func nombresDeTags(tags []sqlc.Tag) []string {
	nombres := make([]string, 0, len(tags))
	for _, t := range tags {
		nombres = append(nombres, t.Nombre)
	}
	return nombres
}
