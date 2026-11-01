package httperr

import (
	"errors"
	"log/slog"
	"net/http"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/domain"
	"github.com/gin-gonic/gin"
)

type Body struct {
	Message string `json:"message"`
}

var (
	ErrNoAutenticado = errors.New("no autenticado")
	ErrTokenInvalido = errors.New("token invalido")
	ErrProhibido     = errors.New("prohibido")
	ErrBodyMuyGrande = errors.New("body muy grande")
	ErrBodyInvalido  = errors.New("body invalido")
)

type regla struct {
	err     error
	status  int
	message string
}

var tabla = []regla{
	{domain.ErrReporteNotFound, http.StatusNotFound, "reporte no encontrado"},
	{domain.ErrTransicionInvalida, http.StatusConflict, "transicion no valida"},
	{domain.ErrEmailTaken, http.StatusConflict, "el email ya está registrado"},
	{domain.ErrInvalidCredentials, http.StatusUnauthorized, "credenciales invalidas"},
	{domain.ErrUserNotFound, http.StatusUnauthorized, "no autenticado"},
	{domain.ErrMultimediaYaExiste, http.StatusConflict, "multimedia ya existe"},
	{domain.ErrArchivoInvalido, http.StatusBadRequest, "archivo invalido"},
	{domain.ErrArchivoMuyGrande, http.StatusRequestEntityTooLarge, "archivo muy grande"},
	{domain.ErrImagenMuyGrande, http.StatusUnprocessableEntity, "imagen muy grande"},
	{domain.ErrAlmacenNoDisponible, http.StatusServiceUnavailable, "almacenamiento no disponible, intenta más tarde"},
	{domain.ErrIncidenteNotFound, http.StatusNotFound, "incidente no encontrado"},
	{domain.ErrIncidenteInvalido, http.StatusBadRequest, ""},
	{domain.ErrIncidenteNameTaken, http.StatusConflict, "ya existe un incidente con ese nombre"},
	{domain.ErrTagNameTaken, http.StatusConflict, "el incidente ya tiene un tag con ese nombre"},
	{domain.ErrAreaIncompleta, http.StatusBadRequest, "area incompleta"},
	{domain.ErrAreaInvalida, http.StatusBadRequest, "area invalida"},
	{domain.ErrEstadoInvalido, http.StatusBadRequest, "estado invalido"},
	{domain.ErrOficialNoPermitido, http.StatusForbidden, "un ciudadano no puede crear reportes oficiales"},
	{domain.ErrEstadoNoPermitido, http.StatusForbidden, "un ciudadano no puede cambiar el estado de un reporte"},
	{ErrNoAutenticado, http.StatusUnauthorized, "no autenticado"},
	{ErrTokenInvalido, http.StatusUnauthorized, "token invalido"},
	{ErrProhibido, http.StatusForbidden, "prohibido"},
	{ErrBodyMuyGrande, http.StatusRequestEntityTooLarge, "body muy grande"},
	{ErrBodyInvalido, http.StatusBadRequest, "body invalido"},
}

func Resolver(err error) (int, Body) {
	for _, r := range tabla {
		if errors.Is(err, r.err) {
			msg := r.message
			if msg == "" {
				msg = err.Error()
			}
			return r.status, Body{Message: msg}
		}
	}
	return http.StatusInternalServerError, Body{Message: "internal server error"}
}

func Responder(c *gin.Context, err error) {
	status, body := Resolver(err)
	if status >= http.StatusInternalServerError {
		slog.ErrorContext(c.Request.Context(), "handle error", "status", status, "route", c.FullPath(), "error", err)
	}
	c.AbortWithStatusJSON(status, body)
}

func ResponderConStatus(c *gin.Context, status int, msg string) {
	if status >= http.StatusInternalServerError {
		slog.ErrorContext(c.Request.Context(), "handle error", "status", status, "route", c.FullPath(), "error", msg)
		msg = "internal server error"
	}
	c.AbortWithStatusJSON(status, Body{Message: msg})
}
