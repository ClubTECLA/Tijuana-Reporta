package repository

import (
	"context"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/domain"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ComentarioRepository struct {
	db *pgxpool.Pool
}

func NewComentarioRepository(db *pgxpool.Pool) *ComentarioRepository {
	return &ComentarioRepository{db: db}
}

func (r *ComentarioRepository) Crear(ctx context.Context, reporteID, userID uuid.UUID, texto string) (domain.Comentario, error) {
	const query = `
		INSERT INTO comentarios (reporte_id, user_id, comentario)
		VALUES ($1, $2, $3)
		RETURNING id, reporte_id, user_id, comentario, created_at
	`

	var c domain.Comentario
	err := r.db.QueryRow(ctx, query, reporteID, userID, texto).Scan(
		&c.ID, &c.ReporteID, &c.UserID, &c.Comentario, &c.CreatedAt,
	)
	if err != nil {
		return domain.Comentario{}, err
	}
	return c, nil
}
