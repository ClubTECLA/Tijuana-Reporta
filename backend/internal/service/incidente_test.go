package service

import (
	"context"
	"errors"
	"strings"
	"testing"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/domain"
	"github.com/jackc/pgx/v5/pgconn"
)

// fakeIncidenteStore implementa IncidenteStore en memoria. Imita a la
// transacción real: asigna ids y llena el IncidenteID de cada tag.
// Guarda los últimos parámetros para revisarlos.
type fakeIncidenteStore struct {
	lastArg   domain.CreateIncidenteTxParams
	called    bool
	createErr error
}

func (f *fakeIncidenteStore) CreateIncidenteConTags(_ context.Context, arg domain.CreateIncidenteTxParams) (domain.IncidenteDetalle, error) {
	f.called = true
	f.lastArg = arg
	if f.createErr != nil {
		return domain.IncidenteDetalle{}, f.createErr
	}

	p := arg.Incidente
	d := domain.IncidenteDetalle{
		Incidente: domain.Incidente{
			ID: 8, Nombre: p.Nombre, TiempoLimite: p.TiempoLimite, Radio: p.Radio,
			EstaActivo: p.EstaActivo, Color: p.Color,
		},
		Tags: make([]domain.Tag, 0, len(arg.Tags)),
	}
	for i, t := range arg.Tags {
		d.Tags = append(d.Tags, domain.Tag{ID: i + 1, IncidenteID: d.Incidente.ID, Nombre: t.Nombre, Peso: t.Peso})
	}
	return d, nil
}

func TestIncidenteService_Crear_ValoresPorDefecto(t *testing.T) {
	store := &fakeIncidenteStore{}
	svc := NewIncidenteService(store)

	d, err := svc.Crear(context.Background(), domain.NuevoIncidente{
		Nombre: "  bache  ",
		Tags:   []domain.NuevoTag{{Nombre: " profundo "}},
	})
	if err != nil {
		t.Fatalf("Crear() error = %v", err)
	}

	p := store.lastArg.Incidente
	if p.Nombre != "bache" || p.Color != colorPorDefecto || !p.EstaActivo {
		t.Fatalf("CreateIncidenteConTags() incidente = %+v, want nombre=\"bache\" color=%s esta_activo=true", p, colorPorDefecto)
	}
	if p.TiempoLimite != nil || p.Radio != nil {
		t.Fatalf("CreateIncidenteConTags() tiempo_limite/radio = %v/%v, want nil/nil", p.TiempoLimite, p.Radio)
	}

	tags := store.lastArg.Tags
	if len(tags) != 1 || tags[0].Nombre != "profundo" || tags[0].Peso != pesoPorDefecto {
		t.Fatalf("CreateIncidenteConTags() tags = %+v, want [{Nombre:profundo Peso:%d}]", tags, pesoPorDefecto)
	}
	if len(d.Tags) != 1 || d.Tags[0].IncidenteID != d.Incidente.ID {
		t.Fatalf("Crear() tags = %+v, want 1 tag con incidente_id=%d", d.Tags, d.Incidente.ID)
	}
}

func TestIncidenteService_Crear_ValoresExplicitos(t *testing.T) {
	store := &fakeIncidenteStore{}
	svc := NewIncidenteService(store)

	_, err := svc.Crear(context.Background(), domain.NuevoIncidente{
		Nombre:       "bache",
		Color:        ptr("#EF6C33"),
		EstaActivo:   ptr(false),
		TiempoLimite: ptr(7),
		Radio:        ptr(25.5),
		Tags:         []domain.NuevoTag{{Nombre: "profundo", Peso: ptr(3)}, {Nombre: "ancho"}},
	})
	if err != nil {
		t.Fatalf("Crear() error = %v", err)
	}

	p := store.lastArg.Incidente
	if p.Color != "#EF6C33" || p.EstaActivo || *p.TiempoLimite != 7 || *p.Radio != 25.5 {
		t.Fatalf("CreateIncidenteConTags() incidente = %+v, want color=#EF6C33 esta_activo=false tiempo_limite=7 radio=25.5", p)
	}

	tags := store.lastArg.Tags
	if len(tags) != 2 || tags[0].Peso != 3 || tags[1].Peso != pesoPorDefecto {
		t.Fatalf("CreateIncidenteConTags() tags = %+v, want pesos [3 %d]", tags, pesoPorDefecto)
	}
}

func TestIncidenteService_Crear_SinTags(t *testing.T) {
	store := &fakeIncidenteStore{}
	svc := NewIncidenteService(store)

	d, err := svc.Crear(context.Background(), domain.NuevoIncidente{Nombre: "bache"})
	if err != nil {
		t.Fatalf("Crear() error = %v", err)
	}
	if len(store.lastArg.Tags) != 0 || len(d.Tags) != 0 {
		t.Fatalf("Crear() tags = %v, want vacío", d.Tags)
	}
}

func TestIncidenteService_Crear_Invalido(t *testing.T) {
	muchosTags := make([]domain.NuevoTag, maxTags+1)
	for i := range muchosTags {
		muchosTags[i] = domain.NuevoTag{Nombre: strings.Repeat("t", i+1)}
	}

	tests := []struct {
		name  string
		nuevo domain.NuevoIncidente
	}{
		{name: "nombre vacío", nuevo: domain.NuevoIncidente{Nombre: ""}},
		{name: "nombre solo espacios", nuevo: domain.NuevoIncidente{Nombre: "   "}},
		{name: "nombre de 101 caracteres", nuevo: domain.NuevoIncidente{Nombre: strings.Repeat("a", 101)}},
		{name: "tiempo_limite negativo", nuevo: domain.NuevoIncidente{Nombre: "bache", TiempoLimite: ptr(-1)}},
		{name: "tiempo_limite fuera de SMALLINT", nuevo: domain.NuevoIncidente{Nombre: "bache", TiempoLimite: ptr(40000)}},
		{name: "radio negativo", nuevo: domain.NuevoIncidente{Nombre: "bache", Radio: ptr(-0.5)}},
		{name: "color sin #", nuevo: domain.NuevoIncidente{Nombre: "bache", Color: ptr("EF6C33")}},
		{name: "color con nombre", nuevo: domain.NuevoIncidente{Nombre: "bache", Color: ptr("red")}},
		{name: "color corto", nuevo: domain.NuevoIncidente{Nombre: "bache", Color: ptr("#FFF")}},
		{name: "tag vacío", nuevo: domain.NuevoIncidente{Nombre: "bache", Tags: []domain.NuevoTag{{Nombre: " "}}}},
		{name: "tag de 51 caracteres", nuevo: domain.NuevoIncidente{Nombre: "bache", Tags: []domain.NuevoTag{{Nombre: strings.Repeat("t", 51)}}}},
		{name: "tag repetido", nuevo: domain.NuevoIncidente{Nombre: "bache", Tags: []domain.NuevoTag{{Nombre: "luz"}, {Nombre: "luz"}}}},
		{name: "tag repetido con mayúsculas", nuevo: domain.NuevoIncidente{Nombre: "bache", Tags: []domain.NuevoTag{{Nombre: "luz"}, {Nombre: " Luz"}}}},
		{name: "peso 0", nuevo: domain.NuevoIncidente{Nombre: "bache", Tags: []domain.NuevoTag{{Nombre: "luz", Peso: ptr(0)}}}},
		{name: "demasiados tags", nuevo: domain.NuevoIncidente{Nombre: "bache", Tags: muchosTags}},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			store := &fakeIncidenteStore{}
			svc := NewIncidenteService(store)

			_, err := svc.Crear(context.Background(), tt.nuevo)
			if !errors.Is(err, domain.ErrIncidenteInvalido) {
				t.Fatalf("Crear() error = %v, want %v", err, domain.ErrIncidenteInvalido)
			}
			if store.called {
				t.Fatalf("Crear() llamó al store con datos inválidos: %+v", store.lastArg)
			}
		})
	}
}

func TestIncidenteService_Crear_NombreRepetido(t *testing.T) {
	store := &fakeIncidenteStore{createErr: &pgconn.PgError{Code: "23505", ConstraintName: "incidentes_nombre_key"}}
	svc := NewIncidenteService(store)

	_, err := svc.Crear(context.Background(), domain.NuevoIncidente{Nombre: "luz"})
	if !errors.Is(err, domain.ErrIncidenteNameTaken) {
		t.Fatalf("Crear() error = %v, want %v", err, domain.ErrIncidenteNameTaken)
	}
}

func TestIncidenteService_Crear_ErrorDelStore(t *testing.T) {
	errDB := errors.New("conexión perdida")
	store := &fakeIncidenteStore{createErr: errDB}
	svc := NewIncidenteService(store)

	_, err := svc.Crear(context.Background(), domain.NuevoIncidente{Nombre: "bache"})
	if !errors.Is(err, errDB) {
		t.Fatalf("Crear() error = %v, want %v", err, errDB)
	}
}
