package centro

import (
	"errors"
	"net/http"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/httperr"
)

var (
	ErrTipoCentroNotFound    = errors.New("tipo_centro not found")
	ErrTipoCentroInvalido    = errors.New("invalid tipo de centro")
	ErrNameTipoCentroTaken   = errors.New("tipo_centro name taken")
	ErrCentroNotFound        = errors.New("centro not found")
	ErrCentroInvalido        = errors.New("invalid centro")
	ErrTipoCentroInexistente = errors.New("tipo_centro inexistente")
)

var ReglasHTTP = []httperr.Regla{
	{Err: ErrTipoCentroNotFound, Status: http.StatusNotFound, Message: "tipo de centro no encontrado"},
	{Err: ErrTipoCentroInvalido, Status: http.StatusBadRequest},
	{Err: ErrNameTipoCentroTaken, Status: http.StatusConflict, Message: "ya existe un tipo de centro con ese nombre"},
	{Err: ErrCentroNotFound, Status: http.StatusNotFound, Message: "centro no encontrado"},
	{Err: ErrCentroInvalido, Status: http.StatusBadRequest},
	{Err: ErrTipoCentroInexistente, Status: http.StatusBadRequest, Message: "el tipo de centro indicado no existe"},
}
