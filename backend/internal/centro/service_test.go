package centro

import (
	"context"
	"errors"
	"strings"
	"testing"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/db/sqlc"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
)

// fakeStore cumple la interfaz store con datos en memoria. Los campos
// tipoErr y centroErr permiten forzar el error que devolvería Postgres.
type fakeStore struct {
	tipos     []sqlc.TiposCentro
	centros   map[uuid.UUID]Centro
	tipoErr   error // lo devuelve CreateTipoCentroTx
	centroErr error // lo devuelve CreateCentroTx
}

func newFakeStore() *fakeStore {
	return &fakeStore{centros: map[uuid.UUID]Centro{}}
}

func (f *fakeStore) CreateTipoCentroTx(ctx context.Context, a CreateTipoCentroTxParams) (sqlc.TiposCentro, error) {
	if f.tipoErr != nil {
		return sqlc.TiposCentro{}, f.tipoErr
	}
	t := sqlc.TiposCentro{ID: len(f.tipos) + 1, Nombre: a.Nombre}
	f.tipos = append(f.tipos, t)
	return t, nil
}

func (f *fakeStore) ListTiposCentro(ctx context.Context) ([]sqlc.TiposCentro, error) {
	return f.tipos, nil // nil si no hay filas, como podría devolver sqlc
}

func (f *fakeStore) GetTipoCentroById(ctx context.Context, id int) (sqlc.TiposCentro, error) {
	for _, t := range f.tipos {
		if t.ID == id {
			return t, nil
		}
	}
	return sqlc.TiposCentro{}, pgx.ErrNoRows
}

func (f *fakeStore) CreateCentroTx(ctx context.Context, a CreateCentroTxParams) (Centro, error) {
	if f.centroErr != nil {
		return Centro{}, f.centroErr
	}
	c := Centro{
		ID:          uuid.New(),
		TipoCentro:  a.Centro.TipoCentro,
		Nombre:      a.Centro.Nombre,
		Descripcion: a.Centro.Descripcion,
		Latitude:    a.Centro.Latitude,
		Longitude:   a.Centro.Longitude,
		Capacidad:   a.Centro.Capacidad,
		Cantidad:    a.Centro.Cantidad,
		Activo:      a.Centro.Activo,
	}
	f.centros[c.ID] = c
	return c, nil
}

func (f *fakeStore) GetCentroById(ctx context.Context, id uuid.UUID) (sqlc.GetCentroByIdRow, error) {
	c, ok := f.centros[id]
	if !ok {
		return sqlc.GetCentroByIdRow{}, pgx.ErrNoRows
	}
	return sqlc.GetCentroByIdRow(c), nil
}

func (f *fakeStore) ListCentros(ctx context.Context, incluirInactivos bool) ([]sqlc.ListCentrosRow, error) {
	out := []sqlc.ListCentrosRow{}
	for _, c := range f.centros {
		if c.Activo || incluirInactivos {
			out = append(out, sqlc.ListCentrosRow(c))
		}
	}
	return out, nil
}

func ptr[T any](v T) *T { return &v }

func nuevoCentroValido() NuevoCentro {
	return NuevoCentro{
		TipoCentro: 1,
		Nombre:     "  Hospital General  ",
		Latitude:   32.5149,
		Longitude:  -117.0382,
	}
}

// --- Tipos de centro ---

func TestService_CrearTipoCentro_QuitaEspacios(t *testing.T) {
	s := NewService(newFakeStore())

	got, err := s.CrearTipoCentro(t.Context(), NuevoTipoCentro{Nombre: "  Hospital  "}, uuid.New())
	if err != nil {
		t.Fatalf("CrearTipoCentro() error = %v, want nil", err)
	}
	if got.Nombre != "Hospital" {
		t.Errorf("CrearTipoCentro().Nombre = %q, want %q", got.Nombre, "Hospital")
	}
}

func TestService_CrearTipoCentro_Invalido(t *testing.T) {
	casos := map[string]string{
		"vacío":         "",
		"solo espacios": "   ",
		"muy largo":     strings.Repeat("x", maxNombre+1),
	}
	for nombre, valor := range casos {
		t.Run(nombre, func(t *testing.T) {
			s := NewService(newFakeStore())
			_, err := s.CrearTipoCentro(t.Context(), NuevoTipoCentro{Nombre: valor}, uuid.New())
			if !errors.Is(err, ErrTipoCentroInvalido) {
				t.Errorf("CrearTipoCentro() error = %v, want ErrTipoCentroInvalido", err)
			}
		})
	}
}

func TestService_CrearTipoCentro_NombreRepetido(t *testing.T) {
	f := newFakeStore()
	f.tipoErr = &pgconn.PgError{Code: "23505"}
	s := NewService(f)

	_, err := s.CrearTipoCentro(t.Context(), NuevoTipoCentro{Nombre: "Hospital"}, uuid.New())
	if !errors.Is(err, ErrNameTipoCentroTaken) {
		t.Errorf("CrearTipoCentro() error = %v, want ErrNameTipoCentroTaken", err)
	}
}

func TestService_ListarTiposCentro_SinFilasDevuelveSliceVacio(t *testing.T) {
	s := NewService(newFakeStore())

	got, err := s.ListarTiposCentro(t.Context())
	if err != nil {
		t.Fatalf("ListarTiposCentro() error = %v, want nil", err)
	}
	if got == nil || len(got) != 0 {
		t.Errorf("ListarTiposCentro() = %#v, want slice vacío no nil", got)
	}
}

func TestService_ObtenerTipoCentro(t *testing.T) {
	f := newFakeStore()
	s := NewService(f)

	creado, err := s.CrearTipoCentro(t.Context(), NuevoTipoCentro{Nombre: "Hospital"}, uuid.New())
	if err != nil {
		t.Fatalf("CrearTipoCentro() error = %v, want nil", err)
	}

	got, err := s.ObtenerTipoCentro(t.Context(), creado.ID)
	if err != nil || got != creado {
		t.Errorf("ObtenerTipoCentro() = %+v, %v, want %+v, nil", got, err, creado)
	}

	_, err = s.ObtenerTipoCentro(t.Context(), 999)
	if !errors.Is(err, ErrTipoCentroNotFound) {
		t.Errorf("ObtenerTipoCentro(999) error = %v, want ErrTipoCentroNotFound", err)
	}
}

// --- Centros ---

func TestService_CrearCentro_AplicaDefaultYQuitaEspacios(t *testing.T) {
	s := NewService(newFakeStore())

	got, err := s.CrearCentro(t.Context(), nuevoCentroValido(), uuid.New())
	if err != nil {
		t.Fatalf("CrearCentro() error = %v, want nil", err)
	}
	if got.Nombre != "Hospital General" {
		t.Errorf("CrearCentro().Nombre = %q, want %q", got.Nombre, "Hospital General")
	}
	if !got.Activo {
		t.Errorf("CrearCentro().Activo = false, want true (default)")
	}
}

func TestService_CrearCentro_RespetaActivoExplicito(t *testing.T) {
	s := NewService(newFakeStore())
	n := nuevoCentroValido()
	n.Activo = ptr(false)

	got, err := s.CrearCentro(t.Context(), n, uuid.New())
	if err != nil {
		t.Fatalf("CrearCentro() error = %v, want nil", err)
	}
	if got.Activo {
		t.Errorf("CrearCentro().Activo = true, want false")
	}
}

func TestService_CrearCentro_Invalido(t *testing.T) {
	casos := map[string]func(*NuevoCentro){
		"nombre vacío":          func(n *NuevoCentro) { n.Nombre = "   " },
		"nombre muy largo":      func(n *NuevoCentro) { n.Nombre = strings.Repeat("x", maxNombre+1) },
		"latitud mayor a 90":    func(n *NuevoCentro) { n.Latitude = 91 },
		"latitud menor a -90":   func(n *NuevoCentro) { n.Latitude = -91 },
		"longitud mayor a 180":  func(n *NuevoCentro) { n.Longitude = 181 },
		"longitud menor a -180": func(n *NuevoCentro) { n.Longitude = -181 },
		"capacidad negativa":    func(n *NuevoCentro) { n.Capacidad = ptr(-1) },
		"cantidad negativa":     func(n *NuevoCentro) { n.Cantidad = ptr(-1) },
		"cantidad mayor que capacidad": func(n *NuevoCentro) {
			n.Capacidad, n.Cantidad = ptr(5), ptr(10)
		},
		"capacidad fuera de rango int32": func(n *NuevoCentro) { n.Capacidad = ptr(maxInt32 + 1) },
		"cantidad fuera de rango int32":  func(n *NuevoCentro) { n.Cantidad = ptr(maxInt32 + 1) },
		"tipo_centro fuera de rango":     func(n *NuevoCentro) { n.TipoCentro = maxInt32 + 1 },
	}
	for nombre, mutar := range casos {
		t.Run(nombre, func(t *testing.T) {
			s := NewService(newFakeStore())
			n := nuevoCentroValido()
			mutar(&n)

			_, err := s.CrearCentro(t.Context(), n, uuid.New())
			if !errors.Is(err, ErrCentroInvalido) {
				t.Errorf("CrearCentro() error = %v, want ErrCentroInvalido", err)
			}
		})
	}
}

func TestService_CrearCentro_CantidadIgualACapacidadEsValida(t *testing.T) {
	s := NewService(newFakeStore())
	n := nuevoCentroValido()
	n.Capacidad, n.Cantidad = ptr(10), ptr(10)

	if _, err := s.CrearCentro(t.Context(), n, uuid.New()); err != nil {
		t.Errorf("CrearCentro() error = %v, want nil", err)
	}
}

func TestService_CrearCentro_TipoCentroInexistente(t *testing.T) {
	f := newFakeStore()
	f.centroErr = &pgconn.PgError{Code: "23503", ConstraintName: "centros_tipo_centros_id_fkey"}
	s := NewService(f)

	_, err := s.CrearCentro(t.Context(), nuevoCentroValido(), uuid.New())
	if !errors.Is(err, ErrTipoCentroInexistente) {
		t.Errorf("CrearCentro() error = %v, want ErrTipoCentroInexistente", err)
	}
}

func TestService_CrearCentro_ErrorDesconocidoSePropaga(t *testing.T) {
	f := newFakeStore()
	boom := errors.New("boom")
	f.centroErr = boom
	s := NewService(f)

	_, err := s.CrearCentro(t.Context(), nuevoCentroValido(), uuid.New())
	if !errors.Is(err, boom) {
		t.Errorf("CrearCentro() error = %v, want %v", err, boom)
	}
}

func TestService_ObtenerCentro(t *testing.T) {
	s := NewService(newFakeStore())

	creado, err := s.CrearCentro(t.Context(), nuevoCentroValido(), uuid.New())
	if err != nil {
		t.Fatalf("CrearCentro() error = %v, want nil", err)
	}

	got, err := s.ObtenerCentro(t.Context(), creado.ID)
	if err != nil || got.ID != creado.ID {
		t.Errorf("ObtenerCentro() = %+v, %v, want id %v, nil", got, err, creado.ID)
	}

	_, err = s.ObtenerCentro(t.Context(), uuid.New())
	if !errors.Is(err, ErrCentroNotFound) {
		t.Errorf("ObtenerCentro(inexistente) error = %v, want ErrCentroNotFound", err)
	}
}

func TestService_ListarCentros_FiltraInactivos(t *testing.T) {
	s := NewService(newFakeStore())

	activo := nuevoCentroValido()
	inactivo := nuevoCentroValido()
	inactivo.Activo = ptr(false)
	for _, n := range []NuevoCentro{activo, inactivo} {
		if _, err := s.CrearCentro(t.Context(), n, uuid.New()); err != nil {
			t.Fatalf("CrearCentro() error = %v, want nil", err)
		}
	}

	soloActivos, err := s.ListarCentros(t.Context(), false)
	if err != nil || len(soloActivos) != 1 {
		t.Errorf("ListarCentros(false) = %d centros, %v, want 1, nil", len(soloActivos), err)
	}
	todos, err := s.ListarCentros(t.Context(), true)
	if err != nil || len(todos) != 2 {
		t.Errorf("ListarCentros(true) = %d centros, %v, want 2, nil", len(todos), err)
	}
}

func TestService_ListarCentros_SinFilasDevuelveSliceVacio(t *testing.T) {
	s := NewService(newFakeStore())

	got, err := s.ListarCentros(t.Context(), false)
	if err != nil {
		t.Fatalf("ListarCentros() error = %v, want nil", err)
	}
	if got == nil || len(got) != 0 {
		t.Errorf("ListarCentros() = %#v, want slice vacío no nil", got)
	}
}
