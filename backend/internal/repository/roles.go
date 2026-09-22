package repository

import (
	"context"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/domain"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type RolesRepository struct {
	db *pgxpool.Pool
}

func NewRolesRepository(db *pgxpool.Pool) *RolesRepository {
	return &RolesRepository{db: db}
}

func (r *RolesRepository) GetDefaultRole(ctx context.Context, reporteID, userID uuid.UUID, texto string) (domain.Roles, error) {
	const query = `
		SELECT * FROM roles WHERE nombre LIKE "ciudadano"
	`

	var c domain.Roles
	err := r.db.QueryRow(ctx, query).Scan(
		&c.ID, &c.Nombre,
	)
	if err != nil {
		return domain.Roles{}, err
	}
	return c, nil
}
