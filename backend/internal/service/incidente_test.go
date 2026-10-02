package service

import (
	"context"
	"errors"
	"slices"
	"strings"
	"testing"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/domain"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
)

// fakeIncidenteStore implementa IncidenteStore en memoria. Imita a la
// transacción real: asigna ids y llena el IncidenteID de cada tag.
// Guarda los últimos parámetros para revisarlos.
//
// incidentes y tags son lo que "ya existe en la base" para las lecturas;
// los tests los llenan con agregarIncidente y agregarTag.
type fakeIncidenteStore struct {
	lastArg   domain.CreateIncidenteTxParams
	called    bool
	createErr error

	incidentes map[int]domain.Incidente
	tags       []domain.Tag

	lastTagsArg    []domain.CreateTagParams
	tagsCalled     bool
	createTagsErr  error
	tagsByIdsCalls int
	tagsByIdCalls  int
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

func (f *fakeIncidenteStore) CreateTags(_ context.Context, arg []domain.CreateTagParams) ([]domain.Tag, error) {
	f.tagsCalled = true
	f.lastTagsArg = arg
	if f.createTagsErr != nil {
		return nil, f.createTagsErr
	}

	creados := make([]domain.Tag, 0, len(arg))
	for _, t := range arg {
		creados = append(creados, f.agregarTag(t.IncidenteID, t.Nombre, t.Peso))
	}
	return creados, nil
}

func (f *fakeIncidenteStore) GetIncidenteById(_ context.Context, id int) (domain.Incidente, error) {
	i, ok := f.incidentes[id]
	if !ok {
		return domain.Incidente{}, pgx.ErrNoRows
	}
	return i, nil
}

// ListIncidentes imita a la consulta: filtra los inactivos y ordena por nombre.
func (f *fakeIncidenteStore) ListIncidentes(_ context.Context, incluirInactivos bool) ([]domain.Incidente, error) {
	var out []domain.Incidente
	for _, i := range f.incidentes {
		if i.EstaActivo || incluirInactivos {
			out = append(out, i)
		}
	}
	slices.SortFunc(out, func(a, b domain.Incidente) int { return strings.Compare(a.Nombre, b.Nombre) })
	return out, nil
}

func (f *fakeIncidenteStore) ListTagsByIncidenteId(_ context.Context, incidenteID int) ([]domain.Tag, error) {
	f.tagsByIdCalls++
	var out []domain.Tag
	for _, t := range f.tags {
		if t.IncidenteID == incidenteID {
			out = append(out, t)
		}
	}
	return out, nil
}

func (f *fakeIncidenteStore) ListTagsByIncidenteIds(_ context.Context, ids []int) ([]domain.Tag, error) {
	f.tagsByIdsCalls++
	var out []domain.Tag
	for _, t := range f.tags {
		if slices.Contains(ids, t.IncidenteID) {
			out = append(out, t)
		}
	}
	return out, nil
}

func (f *fakeIncidenteStore) agregarIncidente(id int, nombre string, activo bool) {
	if f.incidentes == nil {
		f.incidentes = map[int]domain.Incidente{}
	}
	f.incidentes[id] = domain.Incidente{ID: id, Nombre: nombre, EstaActivo: activo, Color: colorPorDefecto}
}

func (f *fakeIncidenteStore) agregarTag(incidenteID int, nombre string, peso int) domain.Tag {
	t := domain.Tag{ID: len(f.tags) + 1, IncidenteID: incidenteID, Nombre: nombre, Peso: peso}
	f.tags = append(f.tags, t)
	return t
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

func TestIncidenteService_Listar(t *testing.T) {
	store := &fakeIncidenteStore{}
	store.agregarIncidente(1, "socavon", true)
	store.agregarIncidente(2, "arbol", true)
	store.agregarIncidente(3, "obsoleto", false)
	store.agregarTag(1, "profundo", 1)
	store.agregarTag(2, "caido", 2)
	store.agregarTag(1, "con agua", 1)
	store.agregarTag(3, "viejo", 1)
	svc := NewIncidenteService(store)

	ds, err := svc.Listar(context.Background(), false)
	if err != nil {
		t.Fatalf("Listar() error = %v", err)
	}
	if len(ds) != 2 || ds[0].Incidente.Nombre != "arbol" || ds[1].Incidente.Nombre != "socavon" {
		t.Fatalf("Listar() = %+v, want [arbol socavon] (sin el inactivo)", ds)
	}
	if len(ds[0].Tags) != 1 || ds[0].Tags[0].Nombre != "caido" {
		t.Fatalf("Listar() tags de arbol = %+v, want [caido]", ds[0].Tags)
	}
	if len(ds[1].Tags) != 2 || ds[1].Tags[0].Nombre != "profundo" || ds[1].Tags[1].Nombre != "con agua" {
		t.Fatalf("Listar() tags de socavon = %+v, want [profundo con agua]", ds[1].Tags)
	}
	if store.tagsByIdsCalls != 1 || store.tagsByIdCalls != 0 {
		t.Fatalf("Listar() consultas de tags = %d en bloque y %d por incidente, want 1 y 0", store.tagsByIdsCalls, store.tagsByIdCalls)
	}

	ds, err = svc.Listar(context.Background(), true)
	if err != nil {
		t.Fatalf("Listar(incluirInactivos) error = %v", err)
	}
	if len(ds) != 3 {
		t.Fatalf("Listar(incluirInactivos) = %d incidentes, want 3", len(ds))
	}
}

func TestIncidenteService_Listar_Vacio(t *testing.T) {
	store := &fakeIncidenteStore{}
	svc := NewIncidenteService(store)

	ds, err := svc.Listar(context.Background(), false)
	if err != nil {
		t.Fatalf("Listar() error = %v", err)
	}
	if ds == nil || len(ds) != 0 {
		t.Fatalf("Listar() = %#v, want slice vacío (no nil)", ds)
	}
	if store.tagsByIdsCalls != 0 {
		t.Fatalf("Listar() pidió tags sin tener incidentes")
	}
}

func TestIncidenteService_Obtener(t *testing.T) {
	store := &fakeIncidenteStore{}
	store.agregarIncidente(1, "socavon", false)
	store.agregarTag(1, "profundo", 1)
	store.agregarTag(2, "de otro", 1)
	svc := NewIncidenteService(store)

	d, err := svc.Obtener(context.Background(), 1)
	if err != nil {
		t.Fatalf("Obtener() error = %v", err)
	}
	if d.Incidente.Nombre != "socavon" || len(d.Tags) != 1 || d.Tags[0].Nombre != "profundo" {
		t.Fatalf("Obtener() = %+v, want socavon (aunque esté inactivo) con [profundo]", d)
	}

	if _, err := svc.Obtener(context.Background(), 99); !errors.Is(err, domain.ErrIncidenteNotFound) {
		t.Fatalf("Obtener() de id inexistente error = %v, want %v", err, domain.ErrIncidenteNotFound)
	}
}

func TestIncidenteService_AgregarTags(t *testing.T) {
	store := &fakeIncidenteStore{}
	store.agregarIncidente(1, "socavon", true)
	store.agregarTag(1, "profundo", 1)
	svc := NewIncidenteService(store)

	tags, err := svc.AgregarTags(context.Background(), 1, []domain.NuevoTag{{Nombre: " ancho "}, {Nombre: "con agua", Peso: ptr(4)}})
	if err != nil {
		t.Fatalf("AgregarTags() error = %v", err)
	}

	arg := store.lastTagsArg
	if len(arg) != 2 || arg[0].IncidenteID != 1 || arg[1].IncidenteID != 1 {
		t.Fatalf("CreateTags() arg = %+v, want 2 tags con incidente_id=1", arg)
	}
	if arg[0].Nombre != "ancho" || arg[0].Peso != pesoPorDefecto || arg[1].Peso != 4 {
		t.Fatalf("CreateTags() arg = %+v, want [{ancho %d} {con agua 4}]", arg, pesoPorDefecto)
	}
	if len(tags) != 2 || tags[0].ID == 0 {
		t.Fatalf("AgregarTags() = %+v, want 2 tags con id", tags)
	}
}

func TestIncidenteService_AgregarTags_Errores(t *testing.T) {
	tests := []struct {
		name        string
		incidenteID int
		nuevos      []domain.NuevoTag
		createErr   error
		want        error
	}{
		{name: "sin tags", incidenteID: 1, nuevos: nil, want: domain.ErrIncidenteInvalido},
		{name: "tag inválido", incidenteID: 1, nuevos: []domain.NuevoTag{{Nombre: "ok"}, {Nombre: " "}}, want: domain.ErrIncidenteInvalido},
		{name: "repetido en la petición", incidenteID: 1, nuevos: []domain.NuevoTag{{Nombre: "a"}, {Nombre: "A"}}, want: domain.ErrIncidenteInvalido},
		{name: "incidente inexistente", incidenteID: 99, nuevos: []domain.NuevoTag{{Nombre: "ancho"}}, want: domain.ErrIncidenteNotFound},
		{name: "ya existe con otras mayúsculas", incidenteID: 1, nuevos: []domain.NuevoTag{{Nombre: "PROFUNDO"}}, want: domain.ErrTagNameTaken},
		{
			name: "carrera: otro lo creó entre medio", incidenteID: 1, nuevos: []domain.NuevoTag{{Nombre: "ancho"}},
			createErr: &pgconn.PgError{Code: "23505", ConstraintName: "tags_incidente_id_nombre_key"},
			want:      domain.ErrTagNameTaken,
		},
		{
			name: "carrera: borraron el incidente", incidenteID: 1, nuevos: []domain.NuevoTag{{Nombre: "ancho"}},
			createErr: &pgconn.PgError{Code: "23503", ConstraintName: "tags_incidente_id_fkey"},
			want:      domain.ErrIncidenteNotFound,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			store := &fakeIncidenteStore{createTagsErr: tt.createErr}
			store.agregarIncidente(1, "socavon", true)
			store.agregarTag(1, "profundo", 1)
			svc := NewIncidenteService(store)

			_, err := svc.AgregarTags(context.Background(), tt.incidenteID, tt.nuevos)
			if !errors.Is(err, tt.want) {
				t.Fatalf("AgregarTags() error = %v, want %v", err, tt.want)
			}
			if tt.createErr == nil && store.tagsCalled {
				t.Fatalf("AgregarTags() llamó a CreateTags con %+v", store.lastTagsArg)
			}
		})
	}
}
