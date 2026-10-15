package main

import (
	"context"
	"log"
	"time"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/api"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/config"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/database"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/service"
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

	// Manejo del timeout de la conexión a la base de datos.
	// Si no se puede hacer ping en 10 segundos, abortar.
	deadlineSeconds := 10 * time.Second
	ctx, cancel := context.WithTimeout(ctx, time.Duration(deadlineSeconds))
	defer cancel()

	if err := pool.Ping(ctx); err != nil {
		log.Fatalf("Failed to connect to database; check database configuration and connectivity: %v", err)
	}

	// Un solo Store para todos los servicios: expone las consultas generadas
	// por sqlc y las operaciones transaccionales sobre el mismo pool.
	store := database.NewStore(pool)

	comentarios := service.NewComentarioService(store)
	reportes := service.NewReporteService(store)
	incidentes := service.NewIncidenteService(store)
	auth, err := service.NewAuthService(ctx, store, []byte(cfg.JWTSecret), cfg.JWTTTL)
	usuarios := service.NewUsuarioService(store)
	if err != nil {
		log.Fatalf("Failed to initialize auth service: %v", err)
	}

	r := api.NewRouter(api.Services{
		Comentarios: comentarios,
		Reportes:    reportes,
		Incidentes:  incidentes,
		Auth:        auth,
		Usuarios:    usuarios,
	}, cfg.JWTSecret)

	log.Printf("server listening on:%s", cfg.APIPort)
	if err := r.Run(":" + cfg.APIPort); err != nil {
		log.Fatal(err)
	}
}
