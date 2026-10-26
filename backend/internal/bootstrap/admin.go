package bootstrap

import (
	"context"
	"errors"
	"log/slog"

	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

// EnsureAdmin crea el usuario admin, o lo vuelve a promover si ya existe.
// Sin email o contraseña no hace nada: en producción basta con no definirlas.
func EnsureAdmin(ctx context.Context, pool *pgxpool.Pool, email, username, password string) error {
	if email == "" || password == "" {
		return nil
	}
	if len(password) < 8 {
		return errors.New("ADMIN_PASSWORD debe tener al menos 8 caracteres")
	}
	if username == "" {
		return errors.New("ADMIN_USERNAME es obligatorio cuando se define ADMIN_EMAIL")
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	tag, err := pool.Exec(ctx, `
		INSERT INTO users (email, username, password_hash, rol_id, state)
		SELECT $1, $2, $3, r.id, 'Verificado'::user_state
		FROM roles r WHERE r.nombre = 'admin'
		ON CONFLICT (email) DO UPDATE
			SET rol_id = EXCLUDED.rol_id, 
				state = EXCLUDED.state,
				password_hash = EXCLUDED.password_hash, 
				updated_at = now()`,
		email, username, string(hash))
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return errors.New("no existe el rol 'admin' en la tabla de roles")
	}
	slog.Info("admin bootstrap listo", "email", email)
	return nil
}
