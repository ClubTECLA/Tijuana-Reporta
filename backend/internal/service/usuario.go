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

func NewUsuarioService(store UsuarioStore) *UsuarioService {
	return &UsuarioService{store: store}
}

func (s *UsuarioService) ListarUsuarios(ctx context.Context) ([]domain.ListAllUsersRow, error) {
	return s.store.ListAllUsers(ctx)
}
