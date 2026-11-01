package httperr

import (
	"errors"
	"log/slog"
	"net/http"

	"github.com/gin-gonic/gin"
)

type Body struct {
	Message string `json:"message"`
}

// Errores de transporte: los produce el middleware o el handler antes de
// llegar a la lógica de negocio. Sus reglas van en toda Tabla.
var (
	ErrNoAutenticado = errors.New("no autenticado")
	ErrTokenInvalido = errors.New("token invalido")
	ErrProhibido     = errors.New("prohibido")
	ErrBodyMuyGrande = errors.New("body muy grande")
	ErrBodyInvalido  = errors.New("body invalido")
)

// Regla traduce un error (o cualquiera que lo envuelva) a un status y un
// mensaje. Un Message vacío responde con err.Error() tal cual.
type Regla struct {
	Err     error
	Status  int
	Message string
}

var transporte = []Regla{
	{ErrNoAutenticado, http.StatusUnauthorized, "no autenticado"},
	{ErrTokenInvalido, http.StatusUnauthorized, "token invalido"},
	{ErrProhibido, http.StatusForbidden, "prohibido"},
	{ErrBodyMuyGrande, http.StatusRequestEntityTooLarge, "body muy grande"},
	{ErrBodyInvalido, http.StatusBadRequest, "body invalido"},
}

// Tabla es la lista de reglas con la que se responde un error. Cada
// funcionalidad declara las reglas de sus errores y el servidor las junta en
// una sola Tabla; así este paquete no importa a ninguna funcionalidad.
type Tabla struct {
	reglas []Regla
}

// NewTabla junta las reglas dadas, en orden, seguidas de las de transporte.
func NewTabla(grupos ...[]Regla) *Tabla {
	t := &Tabla{}
	for _, g := range grupos {
		t.reglas = append(t.reglas, g...)
	}
	t.reglas = append(t.reglas, transporte...)
	return t
}

// Resolver devuelve el status y el body de la primera regla cuyo error está
// en la cadena de err; si ninguna aplica, 500 sin filtrar el error original.
func (t *Tabla) Resolver(err error) (int, Body) {
	for _, r := range t.reglas {
		if errors.Is(err, r.Err) {
			msg := r.Message
			if msg == "" {
				msg = err.Error()
			}
			return r.Status, Body{Message: msg}
		}
	}
	return http.StatusInternalServerError, Body{Message: "internal server error"}
}

func (t *Tabla) Responder(c *gin.Context, err error) {
	status, body := t.Resolver(err)
	if status >= http.StatusInternalServerError {
		slog.ErrorContext(c.Request.Context(), "handle error", "status", status, "route", c.FullPath(), "error", err)
	}
	c.AbortWithStatusJSON(status, body)
}

var soloTransporte = NewTabla()

// Responder responde err con las reglas de transporte. Es para el
// middleware, que solo produce esos errores; los handlers devuelven sus
// errores y el servidor los responde con la Tabla completa.
func Responder(c *gin.Context, err error) {
	soloTransporte.Responder(c, err)
}

func ResponderConStatus(c *gin.Context, status int, msg string) {
	if status >= http.StatusInternalServerError {
		slog.ErrorContext(c.Request.Context(), "handle error", "status", status, "route", c.FullPath(), "error", msg)
		msg = "internal server error"
	}
	c.AbortWithStatusJSON(status, Body{Message: msg})
}
