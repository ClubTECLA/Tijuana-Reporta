package config

import (
	"errors"
	"os"
)

type Config struct {
	DatabaseURL string
	APIPort     string
	JWTSecret   string
}

func Load() (*Config, error) {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		return nil, errors.New("unable to connect to database")
	}

	apiPort := os.Getenv("API_PORT")
	if apiPort == "" {
		return nil, errors.New("unable to connect to API via port")
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		return nil, errors.New("unable to connect to API via JWT_SECRET")
	}

	return &Config{
		DatabaseURL: dbURL,
		APIPort:     apiPort,
		JWTSecret:   jwtSecret,
	}, nil
}
