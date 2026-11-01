package database

import (
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/db/sqlc"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Store expone las consultas que sqlc genera, para los servicios que todavía
// viven en internal/service.
type Store struct {
	*sqlc.Queries
}

func NewStore(pool *pgxpool.Pool) *Store {
	return &Store{Queries: sqlc.New(pool)}
}
