package config

import (
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	DatabaseURL string
	APIPort     string
	JWTSecret   string
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
		missing = append(missing, "API_PORT")
	}
	if cfg.JWTSecret == "" {
		missing = append(missing, "JWT_SECRET")
	}
	if len(missing) > 0 {
		return Config{}, fmt.Errorf("missing environment vars: %v", missing)
	}

	return cfg, nil
}

func getEnvOrDefault(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}

	return fallback
}
