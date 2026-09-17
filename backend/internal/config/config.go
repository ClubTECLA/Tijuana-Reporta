package config

import (
	"fmt"
	"os"
)

type Config struct {
	DatabaseURL string
	APIPort     string
	JWTSecret   string
}

func Load() (Config, error) {
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
		missing = append(missing, "API_PORT")
	}
	if cfg.JWTSecret == "" {
		missing = append(missing, "JWT_SECRET")
	}
	if len(missing) > 0 {
		return Config{}, fmt.Errorf("faltan variables de entorno: %v", missing)
	}
	return cfg, nil
}
