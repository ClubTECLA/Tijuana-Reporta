package repository

import (
	"context"
	"errors"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/domain"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

var errNoImplementado = errors.New("repositorio no implementado todavía")

// ComentarioRepository implementa service.ComentarioRepository sobre Postgres.
//
// TODO: cuando exista internal/database/db (sqlc generate), guardar db.New(pool)
// y usar las queries generadas en lugar del pool directo.
type ComentarioRepository struct {
	pool *pgxpool.Pool
}

func NewComentarioRepository(pool *pgxpool.Pool) *ComentarioRepository {
	return &ComentarioRepository{pool: pool}
}

func (r *ComentarioRepository) Crear(ctx context.Context, reporteID, userID uuid.UUID, texto string) (domain.Comentario, error) {
	return domain.Comentario{}, errNoImplementado
}
