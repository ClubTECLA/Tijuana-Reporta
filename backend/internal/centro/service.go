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
	CreateCentroTx(ctx context.Context, arg CreateCentroTxParams) (Centro, error)
	GetCentroById(ctx context.Context, id uuid.UUID) (sqlc.GetCentroByIdRow, error)
	ListCentros(ctx context.Context, incluirInactivos bool) ([]sqlc.ListCentrosRow, error)
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

func validarCentro(nombre string, lat, lng float64, capacidad, cantidad *int) error {
	if nombre == "" || utf8.RuneCountInString(nombre) > maxNombre {
		return fmt.Errorf("%w: nombre debe tener entre 1 y %d caracteres", ErrCentroInvalido, maxNombre)
	}
	if lat < -90 || lat > 90 {
		return fmt.Errorf("%w: latitude debe estar entre -90 y 90", ErrCentroInvalido)
	}
	if lng < -180 || lng > 180 {
		return fmt.Errorf("%w: longitude debe estar entre -180 y 180", ErrCentroInvalido)
	}
	if capacidad != nil && *capacidad < 0 {
		return fmt.Errorf("%w: capacidad no puede ser negativa", ErrCentroInvalido)
	}
	if cantidad != nil && *cantidad < 0 {
		return fmt.Errorf("%w: cantidad no puede ser negativa", ErrCentroInvalido)
	}
	if capacidad != nil && cantidad != nil && *cantidad > *capacidad {
		return fmt.Errorf("%w: cantidad no puede ser mayor que capacidad", ErrCentroInvalido)
	}
	return nil
}

func (s *Service) CrearCentro(ctx context.Context, nuevo NuevoCentro, userID uuid.UUID) (Centro, error) {
	nombre := strings.TrimSpace(nuevo.Nombre)
	if err := validarCentro(nombre, nuevo.Latitude, nuevo.Longitude, nuevo.Capacidad, nuevo.Cantidad); err != nil {
		return Centro{}, err
	}

	activo := true
	if nuevo.Activo != nil {
		activo = *nuevo.Activo
	}

	row, err := s.store.CreateCentroTx(ctx, CreateCentroTxParams{
		Centro: sqlc.CreateCentroParams{
			TipoCentro:  nuevo.TipoCentro,
			Nombre:      nombre,
			Descripcion: nuevo.Descripcion,
			Latitude:    nuevo.Latitude,
			Longitude:   nuevo.Longitude,
			Capacidad:   nuevo.Capacidad,
			Cantidad:    nuevo.Cantidad,
			Activo:      activo,
		},
		ActorID: userID,
	})
	if db.IsForeignKeyViolation(err, "centros_tipo_centros_id_fkey") {
		return Centro{}, ErrTipoCentroNotFound
	}
	if err != nil {
		return Centro{}, err
	}
	return Centro(row), nil
}

func (s *Service) ObtenerCentro(ctx context.Context, id uuid.UUID) (Centro, error) {
	row, err := s.store.GetCentroById(ctx, id)
	if err != nil {
		if db.IsNotFound(err) {
			return Centro{}, ErrCentroNotFound
		}
		return Centro{}, err
	}
	return Centro(row), nil
}

func (s *Service) ListarCentros(ctx context.Context, incluirInactivos bool) ([]Centro, error) {
	rows, err := s.store.ListCentros(ctx, incluirInactivos)
	if err != nil {
		return nil, err
	}
	out := make([]Centro, 0, len(rows))
	for _, r := range rows {
		out = append(out, Centro(r))
	}
	return out, nil
}
