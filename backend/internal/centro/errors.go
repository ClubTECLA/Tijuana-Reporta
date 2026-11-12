package centro

import (
	"errors"
	"net/http"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/httperr"
)

var (
	ErrTipoCentroNotFound  = errors.New("tipo_centro not found")
	ErrTipoCentroInvalido  = errors.New("invalid tipo_centro")
	ErrNameTipoCentroTaken = errors.New("tipo_centro name taken")
	ErrCentroNotFound      = errors.New("centro not found")
	ErrCentroInvalido      = errors.New("invalid centro")
)

var ReglasHTTP = []httperr.Regla{
	{Err: ErrTipoCentroNotFound, Status: http.StatusNotFound, Message: "tipo de centro no encontrado"},
	{Err: ErrTipoCentroInvalido, Status: http.StatusBadRequest},
	{Err: ErrNameTipoCentroTaken, Status: http.StatusConflict, Message: "ya existe un tipo de centro con ese nombre"},
	{Err: ErrCentroNotFound, Status: http.StatusNotFound, Message: "centro no encontrado"},
	{Err: ErrCentroInvalido, Status: http.StatusBadRequest},
}
