package config

import (
	"fmt"
	"log"
	"os"
	"time"

	"github.com/joho/godotenv"
)

// minJWTSecretLen son 32 bytes (256 bits), el mínimo recomendado para firmar
// HS256: por debajo de eso el secreto es más corto que el tamaño del hash y
// se vuelve más fácil de forzar por fuerza bruta.
const minJWTSecretLen = 32

const defaultJWTTTL = 24 * time.Hour

type Config struct {
	DatabaseURL string
	APIPort     string
	JWTSecret   string
	JWTTTL      time.Duration
}

func Load() (Config, error) {
	err := godotenv.Load()

	if err != nil {
		log.Println("Warning: .env file not found, using environment variables")
	}

	cfg := Config{
		DatabaseURL: os.Getenv("DATABASE_URL"),
		APIPort:     os.Getenv("API_PORT"),
		JWTSecret:   os.Getenv("JWT_SECRET"),
	}
	var missing []string
	if cfg.DatabaseURL == "" {
		missing = append(missing, "DATABASE_URL")
	}
	if cfg.APIPort == "" {
		// Use default value
		cfg.APIPort = "8080"
	}
	if cfg.JWTSecret == "" {
		missing = append(missing, "JWT_SECRET")
	}
	if len(missing) > 0 {
		return Config{}, fmt.Errorf("missing environment vars: %v", missing)
	}
	if len(cfg.JWTSecret) < minJWTSecretLen {
		return Config{}, fmt.Errorf("JWT_SECRET must be at least %d bytes long, got %d", minJWTSecretLen, len(cfg.JWTSecret))
	}

	cfg.JWTTTL = defaultJWTTTL
	if raw := os.Getenv("JWT_TTL"); raw != "" {
		ttl, err := time.ParseDuration(raw)
		if err != nil {
			return Config{}, fmt.Errorf("invalid JWT_TTL: %w", err)
		}
		if ttl <= 0 {
			return Config{}, fmt.Errorf("JWT_TTL must be greater than zero")
		}
		cfg.JWTTTL = ttl
	}

	return cfg, nil
}
