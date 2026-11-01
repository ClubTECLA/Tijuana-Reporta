package server

import (
	"log/slog"
	"net/http"
	"os"
	"runtime/debug"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/comentario"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/httpapi"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/httperr"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/incidente"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/middleware"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/multimedia"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/reporte"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/usuario"
	"github.com/getkin/kin-openapi/openapi3"
	"github.com/getkin/kin-openapi/openapi3filter"
	"github.com/gin-gonic/gin"
	ginmiddleware "github.com/oapi-codegen/gin-middleware"
)

// maxRequestBodyBytes es el tamaño máximo del body en las rutas del contrato.
// Todas reciben JSON chico (el campo de texto más largo es de 500 caracteres),
// así que 1 MiB sobra.
const maxRequestBodyBytes = 1 << 20

// defaultMaxMultimediaBytes es el tamaño máximo del body al subir un archivo a
// un reporte: la foto más el multipart. Debe coincidir con el
// client_max_body_size de nginx para esa ruta.
const defaultMaxMultimediaBytes = 12 << 20

// rutaMultimedia es la ruta del contrato que recibe archivos y por eso no usa
// maxRequestBodyBytes.
const rutaMultimedia = "/v1/reportes/:reporteId/multimedia"

type routerConfig struct {
	maxMultimediaBytes int64
}

// RouterOption ajusta NewRouter.
type RouterOption func(*routerConfig)

// WithMaxMultimediaBytes cambia el tamaño máximo del body al subir un archivo.
func WithMaxMultimediaBytes(n int64) RouterOption {
	return func(c *routerConfig) { c.maxMultimediaBytes = n }
}

// Handlers son los handlers de cada funcionalidad que sirve el router.
type Handlers struct {
	Reportes    *reporte.Handler
	Incidentes  *incidente.Handler
	Comentarios *comentario.Handler
	Usuarios    *usuario.Handler
	Multimedia  *multimedia.Handler
}

// Cada funcionalidad llama Handler a su handler, y dos campos embebidos no
// pueden llamarse igual; con un alias por funcionalidad, cada campo toma el
// nombre del alias y los métodos se siguen promoviendo.
type (
	reportes    = reporte.Handler
	incidentes  = incidente.Handler
	comentarios = comentario.Handler
	usuarios    = usuario.Handler
	multimedias = multimedia.Handler
)

// api junta los handlers de cada funcionalidad en la interfaz que genera
// oapi-codegen. Si dos definen la misma operación, el método queda ambiguo
// y la assertion de abajo no compila.
type api struct {
	*reportes
	*incidentes
	*comentarios
	*usuarios
	*multimedias
}

// Assertion en tiempo de compilación: si el contrato gana un endpoint y
// ninguna funcionalidad lo implementa, el build falla en vez de devolver un
// 404 en runtime.
var _ httpapi.StrictServerInterface = api{}

// NewRouter arma el *gin.Engine completo de la API: /health, las rutas del
// contrato bajo /v1 (con el middleware de auth) /v1/openapi.json y /v1/docs.
//
// New lo usa con los servicios de producción y los tests de integración con
// los suyos, así que ambos levantan exactamente el mismo router.
func NewRouter(h Handlers, jwtSecret string, opts ...RouterOption) *gin.Engine {
	cfg := routerConfig{maxMultimediaBytes: defaultMaxMultimediaBytes}
	for _, opt := range opts {
		opt(&cfg)
	}

	// Una sola tabla con las reglas de todos los errores que pueden devolver
	// los handlers.
	tabla := httperr.NewTabla(reporte.ReglasHTTP, incidente.ReglasHTTP, comentario.ReglasHTTP, usuario.ReglasHTTP, multimedia.ReglasHTTP)

	// Registra acciones con el RequestLogger
	// El logger debe ser lo primero en utilizarse para que se registren los panics con su request_id
	r := gin.New()
	r.Use(
		middleware.RequestLogger(),
		gin.CustomRecoveryWithWriter(nil, func(c *gin.Context, rec any) {
			slog.ErrorContext(c.Request.Context(), "panic", slog.Any("panic", rec),
				slog.String("stack", string(debug.Stack())))
			c.AbortWithStatusJSON(http.StatusInternalServerError, httpapi.ErrorResponse{Message: "internal server error"})
		}),
	)

	// middleware.Auth agrega el userID al context.Context de la petición
	// (c.Request.WithContext), no a *gin.Context.
	//
	// Sin esta flag, (*gin.Context).Value() no consulta ese context.Context
	// oculto, así que UserIDFromContext siempre fallaría en los handlers strict
	// (reciben el *gin.Context como context.Context).
	r.ContextWithFallback = true

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// Las rutas del contrato OpenAPI se montan bajo /v1. No llevan el prefijo
	// /api porque nginx lo quita antes de reenviar la petición.
	//
	// Los middlewares que se pasen aquí son gin.HandlerFunc y corren solo para
	// las rutas generadas, no para /health (es una ruta estática).
	//
	// Los manejadores de error por defecto de oapi-codegen responden {"msg": ...};
	// se reemplazan para que coincidan con ErrorResponse ({"message": ...}).
	strict := httpapi.NewStrictHandlerWithOptions(
		api{reportes: h.Reportes, incidentes: h.Incidentes, comentarios: h.Comentarios, usuarios: h.Usuarios, multimedias: h.Multimedia},
		nil,
		httpapi.StrictGinServerOptions{
			RequestErrorHandlerFunc: func(c *gin.Context, err error) {
				httperr.ResponderConStatus(c, http.StatusBadRequest, err.Error())
			},
			HandlerErrorFunc: tabla.Responder,
			ResponseErrorHandlerFunc: func(c *gin.Context, err error) {
				httperr.ResponderConStatus(c, http.StatusInternalServerError, err.Error())
			},
		})

	swagger, err := httpapi.GetSwagger()
	if err != nil {
		slog.Error("error loading swagger spec", "error", err)
		os.Exit(1)
	}

	swagger.Servers = openapi3.Servers{{URL: "/v1"}}

	validator := ginmiddleware.OapiRequestValidatorWithOptions(swagger, &ginmiddleware.Options{
		Options: openapi3filter.Options{
			// Auth and roles are already checked by middleware.Auth/RequireRole.
			AuthenticationFunc: openapi3filter.NoopAuthenticationFunc,
		},
		ErrorHandler: func(c *gin.Context, message string, statusCode int) {
			httperr.ResponderConStatus(c, statusCode, message)
		},
	})

	httpapi.RegisterHandlersWithOptions(r, strict, httpapi.GinServerOptions{
		BaseURL: "/v1",
		ErrorHandler: func(c *gin.Context, err error, status int) {
			httperr.ResponderConStatus(c, status, err.Error())
		},
		Middlewares: []httpapi.MiddlewareFunc{
			middleware.Auth(jwtSecret, string(httpapi.BearerAuthScopes)),
			middleware.RequireRole(string(httpapi.BearerAuthScopes)),
			// Antes del validador, que lee el body completo para validarlo.
			middleware.BodyLimitFunc(func(c *gin.Context) int64 {
				if c.FullPath() == rutaMultimedia {
					return cfg.maxMultimediaBytes
				}
				return maxRequestBodyBytes
			}),
			httpapi.MiddlewareFunc(validator),
		},
	})

	// El contrato, servido desde el propio binario, para que web y móvil puedan
	// generar sus tipos contra la API que de verdad está corriendo.
	r.GET("/v1/openapi.json", func(c *gin.Context) {
		spec, err := httpapi.GetSpec()
		if err != nil {
			tabla.Responder(c, err)
			return
		}
		// Relativo a la URL del contrato (/v1/ o /api/v1/ tras nginx), para
		// que "Try it out" de Swagger UI llegue a las rutas reales.
		spec.Servers = openapi3.Servers{{URL: "."}}
		c.JSON(http.StatusOK, spec)
	})

	// Documentación interactiva del contrato; carga /v1/openapi.json.
	r.GET("/v1/docs", httpapi.ServeDocs)

	return r
}
