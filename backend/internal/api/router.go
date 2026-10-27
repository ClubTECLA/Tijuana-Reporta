package api

import (
	"log"
	"net/http"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/middleware"
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

// NewRouter arma el *gin.Engine completo de la API: /health, las rutas del
// contrato bajo /v1 (con el middleware de auth) /v1/openapi.json y /v1/docs.
//
// Vive aquí y no en cmd/api para que los tests de integración levanten
// exactamente el mismo router que producción.
func NewRouter(services Services, jwtSecret string, opts ...RouterOption) *gin.Engine {
	cfg := routerConfig{maxMultimediaBytes: defaultMaxMultimediaBytes}
	for _, opt := range opts {
		opt(&cfg)
	}

	r := gin.Default()

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
	strict := NewStrictHandlerWithOptions(
		NewServer(services),
		nil,
		StrictGinServerOptions{
			RequestErrorHandlerFunc: func(c *gin.Context, err error) {
				responderError(c, err, http.StatusBadRequest)
			},
			HandlerErrorFunc: func(c *gin.Context, err error) {
				responderError(c, err, http.StatusInternalServerError)
			},
			ResponseErrorHandlerFunc: func(c *gin.Context, err error) {
				responderError(c, err, http.StatusInternalServerError)
			},
		})

	swagger, err := GetSwagger()
	if err != nil {
		log.Fatalf("error loading swagger spec: %v", err)
	}

	swagger.Servers = openapi3.Servers{{URL: "/v1"}}

	validator := ginmiddleware.OapiRequestValidatorWithOptions(swagger, &ginmiddleware.Options{
		Options: openapi3filter.Options{
			// Auth and roles are already checked by middleware.Auth/RequireRole.
			AuthenticationFunc: openapi3filter.NoopAuthenticationFunc,
		},
		ErrorHandler: func(c *gin.Context, message string, statusCode int) {
			c.AbortWithStatusJSON(statusCode, ErrorResponse{Message: message})
		},
	})

	RegisterHandlersWithOptions(r, strict, GinServerOptions{
		BaseURL:      "/v1",
		ErrorHandler: responderError,
		Middlewares: []MiddlewareFunc{
			middleware.Auth(jwtSecret, string(BearerAuthScopes)),
			middleware.RequireRole(string(BearerAuthScopes)),
			// Antes del validador, que lee el body completo para validarlo.
			middleware.BodyLimitFunc(func(c *gin.Context) int64 {
				if c.FullPath() == rutaMultimedia {
					return cfg.maxMultimediaBytes
				}
				return maxRequestBodyBytes
			}),
			MiddlewareFunc(validator),
		},
	})

	// El contrato, servido desde el propio binario, para que web y móvil puedan
	// generar sus tipos contra la API que de verdad está corriendo.
	r.GET("/v1/openapi.json", func(c *gin.Context) {
		spec, err := GetSpec()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
			return
		}
		// Relativo a la URL del contrato (/v1/ o /api/v1/ tras nginx), para
		// que "Try it out" de Swagger UI llegue a las rutas reales.
		spec.Servers = openapi3.Servers{{URL: "."}}
		c.JSON(http.StatusOK, spec)
	})

	// Documentación interactiva del contrato; carga /v1/openapi.json.
	r.GET("/v1/docs", serveDocs)

	return r
}

// responderError escribe el error con la forma de ErrorResponse del contrato.
func responderError(c *gin.Context, err error, statusCode int) {
	if statusCode >= http.StatusInternalServerError {
		log.Printf("error %d in %s %s: %v", statusCode, c.Request.Method, c.Request.URL.Path, err)
		c.JSON(statusCode, ErrorResponse{Message: "internal server error"})
		return
	}
	c.JSON(statusCode, ErrorResponse{Message: err.Error()})
}
