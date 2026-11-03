package middleware

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"slices"
	"strings"
	"time"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/httperr"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/logging"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type contextKey int

const (
	userIDKey contextKey = iota
	rolKey
)

// ContextWithRol agrega el rol del usuario autenticado al contexto. La llama
// Auth con el claim "rol" del JWT.
func ContextWithRol(ctx context.Context, rol string) context.Context {
	return context.WithValue(ctx, rolKey, rol)
}

// RolFromContext obtiene el rol puesto por el middleware de autenticación.
// Lo usa RequireRole para comparar contra los scopes de la ruta.
func RolFromContext(ctx context.Context) (string, bool) {
	rol, ok := ctx.Value(rolKey).(string)
	return rol, ok
}

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
// El claim "sub" debe llevar el userID (uuid) del usuario autenticado y "rol"
// el nombre de su rol (tabla roles); esto tiene que coincidir con lo que firma
// AuthService.issueToken. Un token sin "rol" (firmado antes de que existiera)
// sigue sirviendo para las rutas que solo piden estar autenticado.
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
			httperr.Responder(c, httperr.ErrNoAutenticado)
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
			httperr.Responder(c, httperr.ErrTokenInvalido)
			return
		}

		// Extract user id claim
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			httperr.Responder(c, httperr.ErrTokenInvalido)
			return
		}

		sub, _ := claims["sub"].(string)
		userID, err := uuid.Parse(sub)
		if err != nil {
			httperr.Responder(c, httperr.ErrTokenInvalido)
			return
		}

		rol, _ := claims["rol"].(string)

		ctx := ContextWithUserID(c.Request.Context(), userID)
		ctx = ContextWithRol(ctx, rol)
		c.Request = c.Request.WithContext(ctx)
		c.Next()
	}
}

// RequireRole rechaza con 403 las peticiones cuyo rol no esté entre los
// scopes que el contrato pide para la ruta (security: - bearerAuth: [admin]).
//
// Debe ir después de Auth: si la ruta no tiene scopes, o la lista está vacía
// (bearerAuth: []), basta con estar autenticado y deja pasar la petición.
func RequireRole(scopesKey string) func(c *gin.Context) {
	return func(c *gin.Context) {
		v, _ := c.Get(scopesKey)
		required, _ := v.([]string)
		if len(required) == 0 {
			return
		}

		rol, _ := RolFromContext(c.Request.Context())
		if !slices.Contains(required, rol) {
			httperr.Responder(c, httperr.ErrProhibido)
			return
		}
	}
}

// BodyLimit rechaza con 413 las peticiones cuyo body pase de maxBytes, antes
// de que el validador de OpenAPI (que lee el body completo) lo procese.
//
// Lee el body con http.MaxBytesReader en vez de confiar en Content-Length,
// que puede faltar (chunked) o mentir; si cabe, lo deja en un buffer para que
// los siguientes handlers lo lean de nuevo.
func BodyLimit(maxBytes int64) func(c *gin.Context) {
	return BodyLimitFunc(func(*gin.Context) int64 { return maxBytes })
}

// BodyLimitFunc es como BodyLimit pero el límite se elige por petición, para
// las rutas que reciben un body más grande que el resto (la subida de fotos).
func BodyLimitFunc(limite func(c *gin.Context) int64) func(c *gin.Context) {
	return func(c *gin.Context) {
		if c.Request.Body == nil || c.Request.Body == http.NoBody {
			return
		}

		body, err := io.ReadAll(http.MaxBytesReader(c.Writer, c.Request.Body, limite(c)))
		if err != nil {
			var maxErr *http.MaxBytesError
			if errors.As(err, &maxErr) {
				httperr.Responder(c, httperr.ErrBodyMuyGrande)
			} else {
				httperr.Responder(c, httperr.ErrBodyInvalido)
			}
			return
		}
		c.Request.Body = io.NopCloser(bytes.NewReader(body))
	}
}

// RequestLogger reemplaza el logger de texto de gin: un registro JSON por
// petición, con un request_id que también queda en el contexto.
func RequestLogger() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()

		id := c.GetHeader("X-Request-ID") // nginx puede mandarlo con $request_id
		if id == "" {
			id = uuid.NewString()
		}
		c.Header("X-Request-ID", id)
		c.Request = c.Request.WithContext(logging.ContextWithRequestID(c.Request.Context(), id))

		c.Next()

		if c.Request.URL.Path == "/health" {
			return
		}

		status := c.Writer.Status()
		attrs := []any{
			slog.String("method", c.Request.Method),
			slog.String("route", c.FullPath()), // /v1/reportes/:reporteId, no el id real
			slog.Int("status", status),
			slog.Duration("latency", time.Since(start)),
			slog.Int("bytes", max(c.Writer.Size(), 0)),
		}
		// Auth reemplazó c.Request, así que aquí ya se ve el userID.
		if uid, ok := UserIDFromContext(c.Request.Context()); ok {
			attrs = append(attrs, slog.String("user_id", uid.String()))
		}

		level := slog.LevelInfo
		switch {
		case status >= 500:
			level = slog.LevelError
		case status >= 400:
			level = slog.LevelWarn
		}
		slog.Log(c.Request.Context(), level, "request", attrs...)
	}
}
