package main

import (
	"log"
	"net/http"
	"os"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/api"
	"github.com/gin-gonic/gin"
)

func main() {
	port := os.Getenv("API_PORT")
	if port == "" {
		port = "8080"
	}

	r := gin.Default()

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// Las rutas del contrato OpenAPI se montan bajo /v1. No llevan el prefijo
	// /api porque nginx lo quita antes de reenviar la petición (ver README).
	//
	// Los middlewares que se pasen aquí son gin.HandlerFunc y corren solo para
	// las rutas generadas, no para /health.
	strict := api.NewStrictHandler(api.NewServer(), nil)
	api.RegisterHandlersWithOptions(r, strict, api.GinServerOptions{
		BaseURL: "/v1",
	})

	// El contrato, servido desde el propio binario, para que web y móvil puedan
	// generar sus tipos contra la API que de verdad está corriendo.
	r.GET("/v1/openapi.json", func(c *gin.Context) {
		spec, err := api.GetSwagger()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
			return
		}
		c.JSON(http.StatusOK, spec)
	})

	log.Printf("servidor escuchando en :%s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal(err)
	}
}
