package usuario

import (
	"context"
	"time"

	"github.com/ClubTECLA/cimalert/backend/internal/db"
	"github.com/ClubTECLA/cimalert/backend/internal/db/sqlc"
	"github.com/ClubTECLA/cimalert/backend/internal/historial"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Store expone las consultas que sqlc genera y añade las operaciones de
// usuarios que necesitan más de una sentencia dentro de una transacción.
type Store struct {
	*sqlc.Queries
	pool *pgxpool.Pool
}

func NewStore(pool *pgxpool.Pool) *Store {
	return &Store{Queries: sqlc.New(pool), pool: pool}
}

// CreateUserWithLocalProvider inserta el usuario y su proveedor de
// autenticación local en la misma transacción, para que nunca quede un
// usuario sin forma de autenticarse (o un auth_provider huérfano) si una de
// las dos falla.
func (s *Store) CreateUserWithLocalProvider(ctx context.Context, arg sqlc.CreateUserParams) (sqlc.User, error) {
	var user sqlc.User

	err := db.ExecTx(ctx, s.pool, func(q *sqlc.Queries) error {
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

// CreatePinRecuperacion, en una transacción que bloquea la fila del usuario,
// revisa el límite por hora, borra los PIN expirados o usados del usuario,
// cancela los activos e inserta el nuevo. Devuelve false, sin crear nada, si
// el usuario ya llegó a arg.MaxPorHora.
func (s *Store) CreatePinRecuperacion(ctx context.Context, arg CreatePinTxParams) (bool, error) {
	creado := false
	err := db.ExecTx(ctx, s.pool, func(q *sqlc.Queries) error {
		if err := q.LockUserByID(ctx, arg.UserID); err != nil {
			return err
		}
		n, err := q.CountPINsLastHourByUserID(ctx, arg.UserID)
		if err != nil {
			return err
		}
		if n >= arg.MaxPorHora {
			return nil
		}
		if err := q.DeleteUsedOrExpiredPINByUserID(ctx, arg.UserID); err != nil {
			return err
		}
		if err := q.CancelPINByUserID(ctx, arg.UserID); err != nil {
			return err
		}
		if err := q.CreatePIN(ctx, sqlc.CreatePINParams{
			UserID:    arg.UserID,
			PinHash:   arg.PinHash,
			ExpiresAt: arg.ExpiresAt,
		}); err != nil {
			return err
		}
		creado = true
		return nil
	})
	return creado, err
}

// ResetPasswordTx, en una transacción, guarda el nuevo password_hash, pone
// password_changed_at a la hora actual de la API y marca el PIN como usado.
func (s *Store) ResetPasswordTx(ctx context.Context, arg ResetPasswordTxParams) error {
	return db.ExecTx(ctx, s.pool, func(q *sqlc.Queries) error {
		// Mismo orden de bloqueo que CreatePinRecuperacion (usuario, luego PIN) para no causar deadlock.
		if err := q.LockUserByID(ctx, arg.UserID); err != nil {
			return err
		}
		filas, err := q.SetPinAsUsedByID(ctx, arg.PinID)
		if err != nil {
			return err
		}
		if filas == 0 {
			return ErrCodigoInvalido
		}
		changedAt := time.Now()
		if err := q.SetNewPasswordByUserID(ctx, sqlc.SetNewPasswordByUserIDParams{
			PasswordHash:      &arg.PasswordHash,
			PasswordChangedAt: &changedAt,
			ID:                arg.UserID,
		}); err != nil {
			return err
		}
		// El actor es el propio usuario: demostró con el PIN que controla su email.
		return historial.Registrar(ctx, q, arg.UserID, "usuario.recuperar_password", "usuario", arg.UserID.String(), nil)
	})
}
