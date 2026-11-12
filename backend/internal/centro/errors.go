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
)

var ReglasHTTP = []httperr.Regla{
	{Err: ErrTipoCentroNotFound, Status: http.StatusNotFound, Message: "tipo de centro no encontrado"},
	{Err: ErrTipoCentroInvalido, Status: http.StatusBadRequest},
	{Err: ErrNameTipoCentroTaken, Status: http.StatusConflict, Message: "ya existe un tipo de centro con ese nombre"},
}
