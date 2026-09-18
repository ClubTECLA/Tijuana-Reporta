package middleware

import (
	"context"

	"github.com/google/uuid"
)

type contextKey int

const userIDKey contextKey = iota

// ContextWithUserID agrega el userID autenticado al contexto. La llama el
// middleware de autenticación (JWT/sesión) una vez validada la petición;
// ese middleware todavía no existe y hay que implementarlo antes de usar
// UserIDFromContext en producción.
func ContextWithUserID(ctx context.Context, userID uuid.UUID) context.Context {
	return context.WithValue(ctx, userIDKey, userID)
}

// UserIDFromContext obtiene el userID puesto por el middleware de autenticación.
func UserIDFromContext(ctx context.Context) (uuid.UUID, bool) {
	userID, ok := ctx.Value(userIDKey).(uuid.UUID)
	return userID, ok
}
