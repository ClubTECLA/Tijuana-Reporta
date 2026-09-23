package middleware

import (
	"context"
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type contextKey int

const userIDKey contextKey = iota

// ContextWithUserID agrega el userID autenticado al contexto. La llama Auth
// una vez validado el JWT de la petición.
func ContextWithUserID(ctx context.Context, userID uuid.UUID) context.Context {
	return context.WithValue(ctx, userIDKey, userID)
}

// UserIDFromContext obtiene el userID puesto por el middleware de autenticación.
func UserIDFromContext(ctx context.Context) (uuid.UUID, bool) {
	userID, ok := ctx.Value(userIDKey).(uuid.UUID)
	return userID, ok
}

// Auth valida el JWT recibido en el header Authorization y, si es válido,
// agrega el userID al contexto de la petición para que UserIDFromContext lo
// encuentre más adelante en la cadena de handlers.
//
// El claim "sub" debe llevar el userID (uuid) del usuario autenticado; esto
// tiene que coincidir con lo que firme el endpoint de login/registro.
//
// scopesKey es la clave de contexto que el wrapper gin generado por
// oapi-codegen setea (c.Set) antes de correr los middlewares, solo para las
// operaciones que el contrato marca con "security". Se recibe como
// parámetro (en vez de importar el paquete api, p. ej. api.BearerAuthScopes)
// porque api ya importa middleware, y ese import aquí crearía un ciclo.
// Rutas sin ese requisito (p. ej. /auth/login) no la setean, así que el
// middleware las deja pasar sin exigir token.
func Auth(secret string, scopesKey string) func(c *gin.Context) {
	return func(c *gin.Context) {
		if _, protected := c.Get(scopesKey); !protected {
			c.Next()
			return
		}

		authHeader := c.GetHeader("Authorization")

		// Reads the Authorization: Bearer <token> header
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			c.JSON(http.StatusUnauthorized, gin.H{"message": "missing Authorization header or invalid format"})
			c.Abort()
			return
		}

		// Parse the JWT
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected sign method: %v", t.Header["alg"])
			}
			return []byte(secret), nil
		}, jwt.WithValidMethods([]string{"HS256"}), jwt.WithExpirationRequired())
		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"message": "invalid token"})
			c.Abort()
			return
		}

		// Extract user id claim
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"message": "invalid token"})
			c.Abort()
			return
		}

		sub, _ := claims["sub"].(string)
		userID, err := uuid.Parse(sub)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"message": "invalid token"})
			c.Abort()
			return
		}

		c.Request = c.Request.WithContext(ContextWithUserID(c.Request.Context(), userID))
		c.Next()
	}
}
