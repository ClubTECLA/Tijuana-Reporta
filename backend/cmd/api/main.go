package main

import (
	"context"
	"log"
	"net/http"
	"time"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/api"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/config"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/database"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/middleware"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/repository"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/service"
	"github.com/gin-gonic/gin"
)

func main() {
	cfg, err := config.Load()

	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	ctx := context.Background()
	pool, err := database.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatal(err)
	}
	defer pool.Close()

	// Timeout handling
	deadlineSeconds := 10 * time.Second
	ctx, cancel := context.WithTimeout(ctx, time.Duration(deadlineSeconds))
	defer cancel()

	if err := pool.Ping(ctx); err != nil {
		log.Fatalf("Failed to connect to database; check database configuration and connectivity: %v", err)
	}

	r := gin.Default()

	// middleware.Auth agrega el userID al context.Context de la petición
	// (c.Request.WithContext), no al propio *gin.Context. Sin este flag,
	// (*gin.Context).Value() no consulta ese context.Context subyacente,
	// así que UserIDFromContext siempre fallaría en los handlers strict
	// (reciben el *gin.Context como context.Context).
	r.ContextWithFallback = true

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// Las rutas del contrato OpenAPI se montan bajo /v1. No llevan el prefijo
	// /api porque nginx lo quita antes de reenviar la petición (ver README).
	//
	// Los middlewares que se pasen aquí son gin.HandlerFunc y corren solo para
	// las rutas generadas, no para /health.
	//
	// Los manejadores de error por defecto de oapi-codegen responden {"msg": ...};
	// se reemplazan para que coincidan con ErrorResponse ({"message": ...}).
	comentarios := service.NewComentarioService(repository.NewComentarioRepository(pool))
	auth := service.NewAuthService(repository.NewUserRepository(pool), []byte(cfg.JWTSecret), cfg.JWTTTL)

	strict := api.NewStrictHandlerWithOptions(
		api.NewServer(api.Services{
			Comentarios: comentarios,
			Auth:        auth,
		}),
		nil,
		api.StrictGinServerOptions{
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
	api.RegisterHandlersWithOptions(r, strict, api.GinServerOptions{
		BaseURL:      "/v1",
		ErrorHandler: responderError,
		Middlewares:  []api.MiddlewareFunc{middleware.Auth(cfg.JWTSecret, string(api.BearerAuthScopes))},
	})

	// El contrato, servido desde el propio binario, para que web y móvil puedan
	// generar sus tipos contra la API que de verdad está corriendo.
	r.GET("/v1/openapi.json", func(c *gin.Context) {
		spec, err := api.GetSpec()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
			return
		}
		c.JSON(http.StatusOK, spec)
	})

	log.Printf("server listening on:%s", cfg.APIPort)
	if err := r.Run(":" + cfg.APIPort); err != nil {
		log.Fatal(err)
	}
}

// responderError escribe el error con la forma de ErrorResponse del contrato.
func responderError(c *gin.Context, err error, statusCode int) {
	if statusCode >= http.StatusInternalServerError {
		log.Printf("error %d in %s %s: %v", statusCode, c.Request.Method, c.Request.URL.Path, err)
		c.JSON(statusCode, api.ErrorResponse{Message: "internal server error"})
		return
	}
	c.JSON(statusCode, api.ErrorResponse{Message: err.Error()})
}
