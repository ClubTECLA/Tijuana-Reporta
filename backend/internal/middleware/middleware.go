package middleware

import (
	"context"

	"github.com/google/uuid"
)

// userIDKey es la clave bajo la que el middleware de autenticación guarda el
// usuario con c.Set(userIDKey, id).
//
// Tiene que ser string: los handlers strict reciben el *gin.Context como
// context.Context, y gin.Context.Value solo busca en c.Keys cuando la clave es
// string.
const userIDKey = "userID"

// UserIDFromContext devuelve el usuario autenticado de la petición.
//
// TODO: todavía no hay middleware JWT que llame a c.Set(userIDKey, ...), así
// que por ahora siempre devuelve false.
func UserIDFromContext(ctx context.Context) (uuid.UUID, bool) {
	id, ok := ctx.Value(userIDKey).(uuid.UUID)
	return id, ok
}
