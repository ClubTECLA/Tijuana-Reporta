package main

import (
	"log"
	"net/http"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/api"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/config"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/database"
	"github.com/gin-gonic/gin"
)

func main() {
	cfg, err := config.Load()

	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	pool, err := database.Connect(cfg.DatabaseURL)

	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	defer pool.Close()

	r := gin.Default()

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
	strict := api.NewStrictHandlerWithOptions(api.NewServer(pool), nil, api.StrictGinServerOptions{
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

	log.Printf("servidor escuchando en :%s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatal(err)
	}
}

// responderError escribe el error con la forma de ErrorResponse del contrato.
func responderError(c *gin.Context, err error, statusCode int) {
	c.JSON(statusCode, api.ErrorResponse{Message: err.Error()})
}
