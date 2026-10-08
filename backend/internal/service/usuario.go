package service

import (
	"context"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/domain"
)

// UsuarioStore es el subconjunto de *database.Store que este servicio usa.
type UsuarioStore interface {
	ListAllUsers(ctx context.Context) ([]domain.ListAllUsersRow, error)
}

type UsuarioService struct {
	store UsuarioStore
}

// NewUsuarioService creates a user service backed by the given store.
func NewUsuarioService(store UsuarioStore) *UsuarioService {
	return &UsuarioService{store: store}
}

// ListarUsuarios returns the store's user summaries, including roles and report
// counts. It preserves the store's ordering, nil results, and errors.
func (s *UsuarioService) ListarUsuarios(ctx context.Context) ([]domain.ListAllUsersRow, error) {
	return s.store.ListAllUsers(ctx)
}
