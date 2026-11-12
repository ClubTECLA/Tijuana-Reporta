package centro

import (
	"context"
	"fmt"
	"strings"
	"unicode/utf8"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/db"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/db/sqlc"
	"github.com/google/uuid"
)

type store interface {
	CreateTipoCentroTx(ctx context.Context, arg CreateTipoCentroTxParams) (sqlc.TiposCentro, error)
	ListTiposCentro(ctx context.Context) ([]sqlc.TiposCentro, error)
	GetTipoCentroById(ctx context.Context, id int) (sqlc.TiposCentro, error)
}

type Service struct {
	store store
}

func NewService(store store) *Service {
	return &Service{store: store}
}

const (
	maxNombre = 50
)

func (s *Service) CrearTipoCentro(ctx context.Context, nuevo NuevoTipoCentro, userID uuid.UUID) (sqlc.TiposCentro, error) {
	nombre := strings.TrimSpace(nuevo.Nombre)
	if nombre == "" || utf8.RuneCountInString(nombre) > maxNombre {
		return sqlc.TiposCentro{}, fmt.Errorf("%w: nombre debe tener entre 1 y %d caracteres", ErrTipoCentroInvalido, maxNombre)
	}

	detalle, err := s.store.CreateTipoCentroTx(ctx, CreateTipoCentroTxParams{
		Nombre:  nombre,
		ActorID: userID,
	})
	if err != nil {
		if db.IsUniqueViolation(err) {
			return sqlc.TiposCentro{}, ErrNameTipoCentroTaken
		}
		return sqlc.TiposCentro{}, err
	}

	return detalle, nil
}

func (s *Service) ListarTiposCentro(ctx context.Context) ([]sqlc.TiposCentro, error) {
	t, err := s.store.ListTiposCentro(ctx)
	if err != nil {
		return nil, err
	}

	if t == nil {
		return []sqlc.TiposCentro{}, nil
	}
	return t, nil
}

func (s *Service) ObtenerTipoCentro(ctx context.Context, id int) (sqlc.TiposCentro, error) {
	t, err := s.store.GetTipoCentroById(ctx, id)
	if err != nil {
		if db.IsNotFound(err) {
			return sqlc.TiposCentro{}, ErrTipoCentroNotFound
		}
		return sqlc.TiposCentro{}, err
	}

	return t, nil
}
