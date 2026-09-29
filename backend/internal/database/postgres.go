package database

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

const (
	connectMaxAttempts = 10
	connectRetryDelay  = 3 * time.Second
)

// Connect resuelve databaseURL y hace ping contra Postgres, reintentando con
// backoff fijo. En Docker Compose el contenedor de backend puede arrancar
// antes de que el DNS interno resuelva el hostname de postgres aunque el
// healthcheck ya haya pasado (carrera conocida en Docker Desktop/WSL2), así
// que un solo intento fallido no debe tumbar el proceso.
func Connect(databaseURL string) (*pgxpool.Pool, error) {
	config, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, err
	}

	var lastErr error
	for attempt := 1; attempt <= connectMaxAttempts; attempt++ {
		pool, err := connectOnce(config)
		if err == nil {
			log.Printf("Succesfully connected to PostgreSQL database")
			return pool, nil
		}

		lastErr = err
		log.Printf("Failed to connect to PostgreSQL (attempt %d/%d): %v", attempt, connectMaxAttempts, err)
		if attempt < connectMaxAttempts {
			time.Sleep(connectRetryDelay)
		}
	}

	return nil, fmt.Errorf("could not connect to PostgreSQL after %d attempts: %w", connectMaxAttempts, lastErr)
}

func connectOnce(config *pgxpool.Config) (*pgxpool.Pool, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	pool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		return nil, err
	}

	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, err
	}

	return pool, nil
}
