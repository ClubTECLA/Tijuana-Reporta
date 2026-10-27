package database

import (
	"context"
	"encoding/json"
	"strconv"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/domain"
	"github.com/google/uuid"
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

// registrarHistorial agrega un evento al historial con la q de la
// transacción en curso, para que el evento y el cambio que describe se
// guarden o se descarten juntos. datos se guarda como JSON; nil deja la
// columna en NULL.
func registrarHistorial(ctx context.Context, q *domain.Queries, actorID uuid.UUID, accion, entidad, entidadID string, datos any) error {
	var raw []byte
	if datos != nil {
		var err error
		if raw, err = json.Marshal(datos); err != nil {
			return err
		}
	}
	return q.CreateHistorialEvento(ctx, domain.CreateHistorialEventoParams{
		ActorID:   &actorID,
		Accion:    accion,
		Entidad:   entidad,
		EntidadID: entidadID,
		Datos:     raw,
	})
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
		if err = q.CreateLocalAuthProvider(ctx, user.ID); err != nil {
			return err
		}
		// El actor es el propio usuario: se registra a sí mismo.
		return registrarHistorial(ctx, q, user.ID, "usuario.registrar", "usuario", user.ID.String(), nil)
	})
	if err != nil {
		return domain.User{}, err
	}

	return user, nil
}

// CreateReporte inserts and returns a report, saving its initial location
// and association with arg.UserID in the same transaction.
// It returns a zero-value report and propagates errors from starting the
// transaction, inserting any record, or committing the transaction.
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

		if _, err = q.CreateUserReporte(ctx, domain.CreateUserReporteParams{
			UserID:    arg.UserID,
			ReporteID: reporte.ID,
		}); err != nil {
			return err
		}

		return registrarHistorial(ctx, q, arg.UserID, "reporte.crear", "reporte", reporte.ID.String(), nil)
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

		return registrarHistorial(ctx, q, arg.ActorID, "incidente.crear", "incidente", strconv.Itoa(detalle.Incidente.ID),
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
func (s *Store) CreateTags(ctx context.Context, arg domain.CreateTagsTxParams) ([]domain.Tag, error) {
	tags := make([]domain.Tag, 0, len(arg.Tags))

	err := s.execTx(ctx, func(q *domain.Queries) error {
		for _, t := range arg.Tags {
			t.IncidenteID = arg.IncidenteID
			tag, err := q.CreateTag(ctx, t)
			if err != nil {
				return err
			}
			tags = append(tags, tag)
		}

		return registrarHistorial(ctx, q, arg.ActorID, "incidente.agregar_tags", "incidente", strconv.Itoa(arg.IncidenteID),
			map[string]any{"tags": nombresDeTags(tags)})
	})
	if err != nil {
		return nil, err
	}

	return tags, nil
}

// CambiarEstadoReporte actualiza el estado del reporte y registra el cambio
// (estado anterior y nuevo) en el historial, en la misma transacción.
func (s *Store) CambiarEstadoReporte(ctx context.Context, arg domain.CambiarEstadoReporteTxParams) (domain.Reporte, error) {
	var reporte domain.Reporte

	err := s.execTx(ctx, func(q *domain.Queries) error {
		anterior, err := q.GetEstadoReporteForUpdate(ctx, arg.ID)
		if err != nil {
			return err // pgx.ErrNoRows, lo mapea IsNotFound en el service
		}

		if reporte, err = q.UpdateEstadoReporte(ctx, domain.UpdateEstadoReporteParams{
			ID:           arg.ID,
			EstadoActual: arg.Estado,
		}); err != nil {
			return err
		}

		return registrarHistorial(ctx, q, arg.ActorID, "reporte.cambiar_estado", "reporte", arg.ID.String(),
			map[string]string{"de": string(anterior), "a": string(arg.Estado)})
	})
	if err != nil {
		return domain.Reporte{}, err
	}

	return reporte, nil
}

// CreateComentario inserta el comentario y lo registra en el historial en la
// misma transacción. Tapa al CreateComentario de sqlc con la misma firma, así
// que el servicio no cambia.
func (s *Store) CreateComentario(ctx context.Context, arg domain.CreateComentarioParams) (domain.CreateComentarioRow, error) {
	var row domain.CreateComentarioRow

	err := s.execTx(ctx, func(q *domain.Queries) error {
		var err error
		if row, err = q.CreateComentario(ctx, arg); err != nil {
			return err
		}

		return registrarHistorial(ctx, q, arg.UserID, "comentario.crear", "comentario", strconv.Itoa(row.ID),
			map[string]string{"reporte_id": arg.ReporteID.String()})
	})
	if err != nil {
		return domain.CreateComentarioRow{}, err
	}

	return row, nil
}

// nombresDeTags devuelve los nombres de los tags, para los datos del historial.
func nombresDeTags(tags []domain.Tag) []string {
	nombres := make([]string, 0, len(tags))
	for _, t := range tags {
		nombres = append(nombres, t.Nombre)
	}
	return nombres
}
