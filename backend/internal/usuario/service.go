package usuario

import (
	"context"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/db/sqlc"
)

// store es lo que Service necesita de Store.
type store interface {
	ListAllUsers(ctx context.Context) ([]sqlc.ListAllUsersRow, error)
}

type Service struct {
	store store
}

// NewService creates a user service backed by the given store.
func NewService(store store) *Service {
	return &Service{store: store}
}

// ListarUsuarios returns the store's user summaries, including roles and report
// counts. It preserves the store's ordering, nil results, and errors.
func (s *Service) ListarUsuarios(ctx context.Context) ([]sqlc.ListAllUsersRow, error) {
	return s.store.ListAllUsers(ctx)
}
