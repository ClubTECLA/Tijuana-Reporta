package main

import (
	"context"
	"log/slog"
	"os"
	"time"
	_ "time/tzdata" // zonas horarias dentro del binario: la imagen no las trae y TZ las necesita

	"github.com/ClubTECLA/cimalert/backend/internal/almacen"
	"github.com/ClubTECLA/cimalert/backend/internal/bootstrap"
	"github.com/ClubTECLA/cimalert/backend/internal/config"
	"github.com/ClubTECLA/cimalert/backend/internal/db"
	"github.com/ClubTECLA/cimalert/backend/internal/db/sqlc"
	"github.com/ClubTECLA/cimalert/backend/internal/logging"
	"github.com/ClubTECLA/cimalert/backend/internal/mantenimiento"
	"github.com/ClubTECLA/cimalert/backend/internal/server"
	"github.com/gin-gonic/gin"
)

// mantenimientoTimeout es lo que se espera a cada llamada del mantenimiento a
// multimedia; es más que el de una subida porque listar una ventana grande tarda.
const mantenimientoTimeout = 2 * time.Minute

func main() {
	cfg, err := config.Load()

	if err != nil {
		slog.Error("failed to load configuration", "error", err) // Default logger, antes de configurar
		os.Exit(1)
	}
	slog.SetDefault(logging.New(cfg.LogLevel, cfg.LogFormat))
	gin.SetMode(gin.ReleaseMode) // Remueve el banner de debug de gin

	ctx := context.Background()
	pool, err := db.Connect(cfg.DatabaseURL)
	if err != nil {
		slog.Error("failed to connect to postgress", "error", err)
		os.Exit(1)
	}
	defer pool.Close()

	// Manejo del timeout de la conexión a la base de datos.
	// Si no se puede hacer ping en 10 segundos, abortar.
	deadlineSeconds := 10 * time.Second
	ctx, cancel := context.WithTimeout(ctx, time.Duration(deadlineSeconds))
	defer cancel()

	if err := pool.Ping(ctx); err != nil {
		slog.Error("failed to connect to database; check database configuration and connectivity", "error", err)
		os.Exit(1)
	}

	if err := bootstrap.EnsureAdmin(ctx, pool, cfg.AdminEmail, cfg.AdminUsername, cfg.AdminPassword); err != nil {
		slog.Error("admin bootstrap failed", "error", err)
		os.Exit(1)
	}

	r, err := server.New(ctx, pool, cfg)
	if err != nil {
		slog.Error("failed to initialize server", "error", err)
		os.Exit(1)
	}

	// Mantenimiento diario de multimedia. Usa su propio contexto: el de arriba
	// tiene un plazo de 10 segundos solo para el arranque.
	tareas, detener := context.WithCancel(context.Background())
	defer detener()
	go mantenimiento.New(
		sqlc.New(pool),
		almacen.NewCliente(cfg.MultimediaURL, mantenimientoTimeout),
		mantenimiento.Opciones{
			Hora:           cfg.MantenimientoHora,
			Minuto:         cfg.MantenimientoMinuto,
			MaxAcciones:    cfg.MantenimientoMaxAcciones,
			CuarentenaDias: cfg.CuarentenaDias,
		},
	).Ejecutar(tareas)

	slog.Info("server listening", "port", cfg.APIPort)
	if err := r.Run(":" + cfg.APIPort); err != nil {
		slog.Error("server stopped", "error", err)
		os.Exit(1)
	}
}
