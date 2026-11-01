package main

import (
	"context"
	"log/slog"
	"os"
	"time"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/bootstrap"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/config"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/db"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/logging"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/server"
	"github.com/gin-gonic/gin"
)

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

	slog.Info("server listening", "port", cfg.APIPort)
	if err := r.Run(":" + cfg.APIPort); err != nil {
		slog.Error("server stopped", "error", err)
		os.Exit(1)
	}
}
