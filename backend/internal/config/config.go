package config

import (
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	DatabaseURL string
	Port        string
}

func Load() (*Config, error) {
	err := godotenv.Load()

	if err != nil {
		log.Println("Warning: .env file not found, using environment variables")
	}

	config := &Config{
		DatabaseURL: os.Getenv("DATABASE_URL"),
		Port:        getEnvOrDefault("API_PORT", "8080"),
	}

	if config.DatabaseURL == "" {
		return nil, fmt.Errorf("falta la variable de entorno DATABASE_URL")
	}

	return config, nil
}

func getEnvOrDefault(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}

	return fallback
}
