package repository

import (
	"context"
	"errors"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/domain"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

// pgUniqueViolation es el código de error de Postgres para unique_violation.
// https://www.postgresql.org/docs/current/errcodes-appendix.html
const pgUniqueViolation = "23505"

type UserRepository struct {
	db *pgxpool.Pool
}

func NewUserRepository(db *pgxpool.Pool) *UserRepository {
	return &UserRepository{db: db}
}

// Create inserta el usuario y su proveedor de autenticación local en la
// misma transacción, para que nunca quede un usuario sin forma de
// autenticarse (o un auth_provider huérfano) si una de las dos falla.
func (r *UserRepository) Create(ctx context.Context, email, username, hash string, rolID int) (domain.Users, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return domain.Users{}, err
	}
	defer tx.Rollback(ctx)

	const insertUser = `
		INSERT INTO users (email, username, rol_id, password_hash)
		VALUES ($1, $2, $3, $4)
		RETURNING id, email, phone, username, rol_id, created_at, updated_at
	`

	var u domain.Users
	err = tx.QueryRow(ctx, insertUser, email, username, rolID, hash).Scan(
		&u.ID, &u.Email, &u.Phone, &u.UserName, &u.RolID, &u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == pgUniqueViolation {
			return domain.Users{}, domain.ErrEmailTaken
		}
		return domain.Users{}, err
	}

	const insertAuthProvider = `
		INSERT INTO auth_providers (user_id, provider)
		VALUES ($1, 'local')
	`
	if _, err := tx.Exec(ctx, insertAuthProvider, u.ID); err != nil {
		return domain.Users{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return domain.Users{}, err
	}

	return u, nil
}

func (r *UserRepository) GetByEmail(ctx context.Context, email string) (domain.Users, error) {
	const query = `
		SELECT id, email, phone, username, rol_id, password_hash, created_at, updated_at
		FROM users
		WHERE email = $1
	`

	var u domain.Users
	err := r.db.QueryRow(ctx, query, email).Scan(
		&u.ID, &u.Email, &u.Phone, &u.UserName, &u.RolID, &u.PasswordHash, &u.CreatedAt, &u.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.Users{}, domain.ErrUserNotFound
	}
	if err != nil {
		return domain.Users{}, err
	}
	return u, nil
}

func (r *UserRepository) GetByID(ctx context.Context, id uuid.UUID) (domain.Users, error) {
	const query = `
		SELECT id, email, phone, username, rol_id, password_hash, created_at, updated_at
		FROM users
		WHERE id = $1
	`

	var u domain.Users
	err := r.db.QueryRow(ctx, query, id).Scan(
		&u.ID, &u.Email, &u.Phone, &u.UserName, &u.RolID, &u.PasswordHash, &u.CreatedAt, &u.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.Users{}, domain.ErrUserNotFound
	}
	if err != nil {
		return domain.Users{}, err
	}
	return u, nil
}
