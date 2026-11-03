package usuario

import (
	"errors"
	"net/http"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/httperr"
)

var (
	ErrEmailTaken         = errors.New("email already registered")
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrUserNotFound       = errors.New("user not found")
)

// ReglasHTTP dice con qué status y mensaje responde la API cada error de
// arriba. Al agregar un Err…, agrégale aquí su regla.
var ReglasHTTP = []httperr.Regla{
	{Err: ErrEmailTaken, Status: http.StatusConflict, Message: "el email ya está registrado"},
	{Err: ErrInvalidCredentials, Status: http.StatusUnauthorized, Message: "credenciales invalidas"},
	{Err: ErrUserNotFound, Status: http.StatusUnauthorized, Message: "no autenticado"},
}
