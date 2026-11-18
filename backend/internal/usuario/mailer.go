package usuario

import (
	"context"
	"fmt"
	"log/slog"

	"github.com/google/uuid"
)

// Mailer envía los correos de recuperación. Solo hay stubs hasta elegir
// proveedor; uno real (Resend, SES, …) se agrega aquí sin tocar Recuperacion.
type Mailer interface {
	// EnviarPinRecuperacion manda el PIN de 6 dígitos a email.
	EnviarPinRecuperacion(ctx context.Context, userID uuid.UUID, email, pin string) error
	// EnviarAvisoPasswordCambiado avisa a email que su contraseña cambió.
	EnviarAvisoPasswordCambiado(ctx context.Context, userID uuid.UUID, email string) error
}

// NewMailer construye el Mailer según MAIL_DRIVER: "log" -> LogMailer,
// "" -> NoopMailer; cualquier otro valor es error.
func NewMailer(driver string) (Mailer, error) {
	switch driver {
	case "":
		return NoopMailer{}, nil
	case "log":
		return LogMailer{}, nil
	default:
		return nil, fmt.Errorf("MAIL_DRIVER desconocido: %q", driver)
	}
}

// LogMailer imprime destinatario y PIN en el log. Solo para desarrollo (MAIL_DRIVER=log).
type LogMailer struct{}

func (LogMailer) EnviarPinRecuperacion(ctx context.Context, userID uuid.UUID, email, pin string) error {
	slog.InfoContext(ctx, "PIN de recuperación (MAIL_DRIVER=log, solo desarrollo)",
		"user_id", userID, "email", email, "pin", pin)
	return nil
}

func (LogMailer) EnviarAvisoPasswordCambiado(ctx context.Context, userID uuid.UUID, email string) error {
	slog.InfoContext(ctx, "aviso de password cambiado (MAIL_DRIVER=log, solo desarrollo)",
		"user_id", userID, "email", email)
	return nil
}

// NoopMailer es el default: solo loguea el user id. Nunca el PIN ni el email.
// shortcut: nadie recibe el PIN en producción; reemplazar por un proveedor real.
type NoopMailer struct{}

func (NoopMailer) EnviarPinRecuperacion(ctx context.Context, userID uuid.UUID, _, _ string) error {
	slog.InfoContext(ctx, "recuperación solicitada; sin MAIL_DRIVER, no se envió correo", "user_id", userID)
	return nil
}

func (NoopMailer) EnviarAvisoPasswordCambiado(ctx context.Context, userID uuid.UUID, _ string) error {
	slog.InfoContext(ctx, "password cambiado; sin MAIL_DRIVER, no se envió aviso", "user_id", userID)
	return nil
}
