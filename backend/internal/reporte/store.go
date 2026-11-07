package reporte

import (
	"context"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/db"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/db/sqlc"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/historial"
	"github.com/google/uuid"
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

// ActualizarTags reemplaza los tags que arg.UserID confirmó en el reporte por
// arg.TagIDs y registra lo agregado y lo quitado en el historial, en la misma
// transacción. Devuelve pgx.ErrNoRows si el reporte no existe y ErrTagInvalido
// si algún tag no es del catálogo del incidente del reporte. Los conteos y el
// score los recalcula el trigger trg_update_tag_counts.
func (s *Store) ActualizarTags(ctx context.Context, arg ActualizarTagsTxParams) error {
	// pgx manda un slice nil como NULL, y con NULL el DELETE no borraría nada.
	tagIDs := arg.TagIDs
	if tagIDs == nil {
		tagIDs = []int{}
	}

	return db.ExecTx(ctx, s.pool, func(q *sqlc.Queries) error {
		// Antes de leer nada: el DELETE y el INSERT de abajo deben ver lo que
		// dejó la petición anterior del mismo usuario, ya confirmado.
		if err := q.LockTagsUsuario(ctx, sqlc.LockTagsUsuarioParams{
			ReporteID: arg.ReporteID,
			UserID:    arg.UserID,
		}); err != nil {
			return err
		}

		incidenteID, err := q.GetIncidenteIdByReporteId(ctx, arg.ReporteID)
		if err != nil {
			return err // pgx.ErrNoRows, lo mapea IsNotFound en el service
		}

		validos, err := q.CountTagsByIncidenteId(ctx, sqlc.CountTagsByIncidenteIdParams{
			IncidenteID: incidenteID,
			TagIds:      tagIDs,
		})
		if err != nil {
			return err
		}
		if validos != len(tagIDs) {
			return ErrTagInvalido
		}

		quitados, err := q.DeleteTagsUsuarioNotIn(ctx, sqlc.DeleteTagsUsuarioNotInParams{
			ReporteID: arg.ReporteID,
			AddedBy:   arg.UserID,
			TagIds:    tagIDs,
		})
		if err != nil {
			return err
		}

		agregados, err := q.CreateTagsUsuario(ctx, sqlc.CreateTagsUsuarioParams{
			ReporteID: arg.ReporteID,
			AddedBy:   arg.UserID,
			TagIds:    tagIDs,
		})
		if err != nil {
			return err
		}

		// Repetir la misma petición no cambia nada: no ensucia el historial.
		if len(agregados) == 0 && len(quitados) == 0 {
			return nil
		}
		// sqlc devuelve nil sin filas; se guarda [] en vez de null.
		if agregados == nil {
			agregados = []int{}
		}
		if quitados == nil {
			quitados = []int{}
		}
		return historial.Registrar(ctx, q, arg.UserID, "reporte.actualizar_tags", "reporte", arg.ReporteID.String(),
			map[string][]int{"agregados": agregados, "quitados": quitados})
	})
}

// EliminarReporte borra el reporte (lo demás cae por ON DELETE CASCADE) y
// registra quién lo borró en el historial, en la misma transacción. Devuelve
// pgx.ErrNoRows si el reporte no existe.
func (s *Store) EliminarReporte(ctx context.Context, id, actorID uuid.UUID) error {
	return db.ExecTx(ctx, s.pool, func(q *sqlc.Queries) error {
		borrado, err := q.DeleteReporteById(ctx, id)
		if err != nil {
			return err // pgx.ErrNoRows, lo mapea IsNotFound en el service
		}
		return historial.Registrar(ctx, q, actorID, "reporte.eliminar", "reporte", id.String(),
			map[string]int{"incidente_id": borrado.IncidenteID})
	})
}
