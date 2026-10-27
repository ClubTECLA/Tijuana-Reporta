package logging

import (
	"context"
	"log/slog"
	"os"
	"strings"
)

type ctxKey int

const requestIDKey ctxKey = iota

// Crea y arma un nuevo logger para la API.
// Salida en JSON a stdout o texto si es necesario
func New(level, format string) *slog.Logger {
	opts := &slog.HandlerOptions{Level: parseLevel(level)}

	var h slog.Handler
	if format == "text" {
		h = slog.NewTextHandler(os.Stdout, opts)
	} else {
		h = slog.NewJSONHandler(os.Stdout, opts)
	}
	return slog.New(contextHandler{h})
}

// Utilizar el nivel de slog adecuado
func parseLevel(s string) slog.Level {
	switch strings.ToLower(s) {
	case "debug":
		return slog.LevelDebug
	case "warn":
		return slog.LevelWarn
	case "error":
		return slog.LevelError
	default:
		return slog.LevelInfo
	}
}

// Almacena el id de la petición para que todo el log lo lleve
func ContextWithRequestID(ctx context.Context, id string) context.Context {
	return context.WithValue(ctx, requestIDKey, id)
}

func RequestIDFromContext(ctx context.Context) string {
	id, _ := ctx.Value(requestIDKey).(string)
	return id
}

// Agrega request_id a cada registro que venga con un contexto
type contextHandler struct{ slog.Handler }

func (h contextHandler) Handle(ctx context.Context, r slog.Record) error {
	if id := RequestIDFromContext(ctx); id != "" {
		r.AddAttrs(slog.String("request_id", id))
	}
	return h.Handler.Handle(ctx, r)
}

func (h contextHandler) WithAttrs(a []slog.Attr) slog.Handler {
	return contextHandler{h.Handler.WithAttrs(a)}
}
func (h contextHandler) WithGroup(n string) slog.Handler {
	return contextHandler{h.Handler.WithGroup(n)}
}
