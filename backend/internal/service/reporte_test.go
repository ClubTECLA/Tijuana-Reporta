package service

import (
	"context"
	"errors"
	"testing"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/domain"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
)

// fakeReporteStore implementa ReporteStore en memoria.
// CreateReporte imita a la transacción real (reporte + location + foto) y al
// trigger que mantiene puntos_origen, para que Obtener devuelva un detalle
// realista.
// Guarda los últimos parámetros de CreateReporte y ListReportesResumen para
// revisarlos.
type fakeReporteStore struct {
	byID        map[uuid.UUID]domain.Reporte
	puntos      map[uuid.UUID]domain.GetPuntoOrigenByReporteIdRow
	comentarios map[uuid.UUID][]domain.Comentario
	fotos       map[uuid.UUID][]domain.FotosReporte
	tags        map[uuid.UUID][]domain.ListTagsByReporteIdRow
	locations   map[uuid.UUID][]domain.ListLocationsByReporteIdRow
	resumen     []domain.ListReportesResumenRow

	lastArg     domain.CreateReporteTxParams
	lastListArg domain.ListReportesResumenParams
	listCalled  bool

	createErr error
	listErr   error
}

func newFakeReporteStore() *fakeReporteStore {
	return &fakeReporteStore{
		byID:        map[uuid.UUID]domain.Reporte{},
		puntos:      map[uuid.UUID]domain.GetPuntoOrigenByReporteIdRow{},
		comentarios: map[uuid.UUID][]domain.Comentario{},
		fotos:       map[uuid.UUID][]domain.FotosReporte{},
		tags:        map[uuid.UUID][]domain.ListTagsByReporteIdRow{},
		locations:   map[uuid.UUID][]domain.ListLocationsByReporteIdRow{},
	}
}

func (f *fakeReporteStore) CreateReporte(_ context.Context, arg domain.CreateReporteTxParams) (domain.Reporte, error) {
	f.lastArg = arg
	if f.createErr != nil {
		return domain.Reporte{}, f.createErr
	}
	r := domain.Reporte{
		ID:          uuid.New(),
		IncidenteID: arg.Reporte.IncidenteID,
		EsOficial:   arg.Reporte.EsOficial,
	}
	f.byID[r.ID] = r
	f.locations[r.ID] = []domain.ListLocationsByReporteIdRow{
		{ID: 1, ReporteID: r.ID, Latitude: arg.Latitude, Longitude: arg.Longitude, UserID: arg.UserID},
	}
	// Con una sola location, el centroide es esa misma location.
	f.puntos[r.ID] = domain.GetPuntoOrigenByReporteIdRow{Latitude: arg.Latitude, Longitude: arg.Longitude}
	for i, path := range arg.ImagePaths {
		f.fotos[r.ID] = append(f.fotos[r.ID], domain.FotosReporte{ID: i + 1, ReporteID: r.ID, ImagePath: path, UserID: arg.UserID})
	}
	return r, nil
}

func (f *fakeReporteStore) GetReporteById(_ context.Context, id uuid.UUID) (domain.Reporte, error) {
	r, ok := f.byID[id]
	if !ok {
		return domain.Reporte{}, pgx.ErrNoRows
	}
	return r, nil
}

func (f *fakeReporteStore) GetPuntoOrigenByReporteId(_ context.Context, id uuid.UUID) (domain.GetPuntoOrigenByReporteIdRow, error) {
	p, ok := f.puntos[id]
	if !ok {
		return domain.GetPuntoOrigenByReporteIdRow{}, pgx.ErrNoRows
	}
	return p, nil
}

func (f *fakeReporteStore) ListComentariosByReporteId(_ context.Context, id uuid.UUID) ([]domain.Comentario, error) {
	return f.comentarios[id], nil
}

func (f *fakeReporteStore) ListFotosByReporteId(_ context.Context, id uuid.UUID) ([]domain.FotosReporte, error) {
	return f.fotos[id], nil
}

func (f *fakeReporteStore) ListTagsByReporteId(_ context.Context, id uuid.UUID) ([]domain.ListTagsByReporteIdRow, error) {
	return f.tags[id], nil
}

func (f *fakeReporteStore) ListLocationsByReporteId(_ context.Context, id uuid.UUID) ([]domain.ListLocationsByReporteIdRow, error) {
	return f.locations[id], nil
}

func (f *fakeReporteStore) ListReportesResumen(_ context.Context, arg domain.ListReportesResumenParams) ([]domain.ListReportesResumenRow, error) {
	f.listCalled = true
	f.lastListArg = arg
	if f.listErr != nil {
		return nil, f.listErr
	}
	return f.resumen, nil
}

func (f *fakeReporteStore) AddAvistamientoById(_ context.Context, id uuid.UUID) (domain.AddAvistamientoByIdRow, error) {
	r, ok := f.byID[id]
	if !ok {
		return domain.AddAvistamientoByIdRow{}, pgx.ErrNoRows
	}
	r.Avistamientos++
	f.byID[id] = r
	return domain.AddAvistamientoByIdRow{ID: id, Avistamientos: r.Avistamientos}, nil
}

func TestReporteService_Crear(t *testing.T) {
	store := newFakeReporteStore()
	svc := NewReporteService(store)
	userID := uuid.New()
	imagePath := "/srv/photos/0001.jpg"

	r, err := svc.Crear(context.Background(), userID, 42, 32.5027, -117.00371, &imagePath)
	if err != nil {
		t.Fatalf("Crear() error = %v", err)
	}
	if r.Reporte.IncidenteID != 42 {
		t.Fatalf("Crear() = %+v, want incidenteID=%d", r.Reporte, 42)
	}
	// Crear relee el reporte con Obtener: el detalle ya trae el centroide,
	// la location inicial y la foto.
	if r.Latitude != 32.5027 || r.Longitude != -117.00371 {
		t.Fatalf("Crear() centroide = (%v, %v), want (%v, %v)", r.Latitude, r.Longitude, 32.5027, -117.00371)
	}
	if len(r.Locations) != 1 || len(r.Fotos) != 1 || r.Fotos[0].ImagePath != imagePath {
		t.Fatalf("Crear() locations = %v fotos = %v, want 1 location y la foto %q", r.Locations, r.Fotos, imagePath)
	}

	arg := store.lastArg
	if arg.UserID != userID || arg.Latitude != 32.5027 || arg.Longitude != -117.00371 {
		t.Fatalf("CreateReporte() arg = %+v, want userID=%v lat=%v lng=%v", arg, userID, 32.5027, -117.00371)
	}
	if len(arg.ImagePaths) != 1 || arg.ImagePaths[0] != imagePath {
		t.Fatalf("CreateReporte() ImagePaths = %v, want [%q]", arg.ImagePaths, imagePath)
	}
}

func TestReporteService_Crear_SinFoto(t *testing.T) {
	store := newFakeReporteStore()
	svc := NewReporteService(store)

	if _, err := svc.Crear(context.Background(), uuid.New(), 42, 32.5027, -117.00371, nil); err != nil {
		t.Fatalf("Crear() error = %v", err)
	}
	if len(store.lastArg.ImagePaths) != 0 {
		t.Fatalf("CreateReporte() ImagePaths = %v, want empty", store.lastArg.ImagePaths)
	}
}

func TestReporteService_Crear_IncidenteNoExiste(t *testing.T) {
	store := newFakeReporteStore()
	store.createErr = &pgconn.PgError{Code: "23503", ConstraintName: "reporte_incidente_id_fkey"}
	svc := NewReporteService(store)

	_, err := svc.Crear(context.Background(), uuid.New(), 999, 32.5027, -117.00371, nil)
	if !errors.Is(err, domain.ErrIncidenteNotFound) {
		t.Fatalf("Crear() error = %v, want %v", err, domain.ErrIncidenteNotFound)
	}
}

func TestReporteService_Obtener(t *testing.T) {
	store := newFakeReporteStore()
	svc := NewReporteService(store)

	creado, err := svc.Crear(context.Background(), uuid.New(), 42, 32.5027, -117.00371, nil)
	if err != nil {
		t.Fatalf("Crear() error = %v", err)
	}
	id := creado.Reporte.ID
	store.comentarios[id] = []domain.Comentario{{ID: 1, ReporteID: id, Comentario: "sigue ahí"}}
	store.tags[id] = []domain.ListTagsByReporteIdRow{{ID: 3, Nombre: "profundo", Count: 2}}

	r, err := svc.Obtener(context.Background(), id)
	if err != nil {
		t.Fatalf("Obtener() error = %v", err)
	}
	if r.Reporte.ID != id || r.Reporte.IncidenteID != 42 {
		t.Fatalf("Obtener() = %+v, want id=%v incidenteID=%d", r.Reporte, id, 42)
	}
	if r.Latitude != 32.5027 || r.Longitude != -117.00371 {
		t.Fatalf("Obtener() centroide = (%v, %v), want (%v, %v)", r.Latitude, r.Longitude, 32.5027, -117.00371)
	}
	if len(r.Comentarios) != 1 || len(r.Tags) != 1 || len(r.Locations) != 1 || len(r.Fotos) != 0 {
		t.Fatalf("Obtener() comentarios=%d tags=%d locations=%d fotos=%d, want 1, 1, 1, 0",
			len(r.Comentarios), len(r.Tags), len(r.Locations), len(r.Fotos))
	}
}

func TestReporteService_Obtener_NoEncontrado(t *testing.T) {
	svc := NewReporteService(newFakeReporteStore())

	_, err := svc.Obtener(context.Background(), uuid.New())
	if !errors.Is(err, domain.ErrReporteNotFound) {
		t.Fatalf("Obtener() error = %v, want %v", err, domain.ErrReporteNotFound)
	}
}

func ptr(v float64) *float64 { return &v }

func TestReporteService_Listar_SinArea(t *testing.T) {
	store := newFakeReporteStore()
	store.resumen = []domain.ListReportesResumenRow{{ID: uuid.New(), IncidenteID: 2}}
	svc := NewReporteService(store)

	rows, err := svc.Listar(context.Background(), nil, nil, nil, nil)
	if err != nil {
		t.Fatalf("Listar() error = %v", err)
	}
	if len(rows) != 1 {
		t.Fatalf("Listar() = %d filas, want 1", len(rows))
	}
	if a := store.lastListArg; a.MinLat != nil || a.MaxLat != nil || a.MinLng != nil || a.MaxLng != nil {
		t.Fatalf("ListReportesResumen() arg = %+v, want todos nil", a)
	}
}

func TestReporteService_Listar_ConArea(t *testing.T) {
	store := newFakeReporteStore()
	svc := NewReporteService(store)

	if _, err := svc.Listar(context.Background(), ptr(32.4), ptr(32.6), ptr(-117.2), ptr(-116.8)); err != nil {
		t.Fatalf("Listar() error = %v", err)
	}
	a := store.lastListArg
	if a.MinLat == nil || *a.MinLat != 32.4 || a.MaxLat == nil || *a.MaxLat != 32.6 ||
		a.MinLng == nil || *a.MinLng != -117.2 || a.MaxLng == nil || *a.MaxLng != -116.8 {
		t.Fatalf("ListReportesResumen() arg = %+v, want el área recibida", a)
	}
}

func TestReporteService_Listar_AreaIncompleta(t *testing.T) {
	store := newFakeReporteStore()
	svc := NewReporteService(store)

	_, err := svc.Listar(context.Background(), ptr(32.4), nil, nil, nil)
	if !errors.Is(err, domain.ErrAreaIncompleta) {
		t.Fatalf("Listar() error = %v, want %v", err, domain.ErrAreaIncompleta)
	}
	if store.listCalled {
		t.Fatal("Listar() consultó la store con un área incompleta")
	}
}

func TestReporteService_Listar_AreaInvalida(t *testing.T) {
	tests := []struct {
		name                           string
		minLat, maxLat, minLng, maxLng float64
	}{
		{"latitud invertida", 32.6, 32.4, -117.2, -116.8},
		{"longitud invertida", 32.4, 32.6, -116.8, -117.2},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			svc := NewReporteService(newFakeReporteStore())

			_, err := svc.Listar(context.Background(), ptr(tt.minLat), ptr(tt.maxLat), ptr(tt.minLng), ptr(tt.maxLng))
			if !errors.Is(err, domain.ErrAreaInvalida) {
				t.Fatalf("Listar() error = %v, want %v", err, domain.ErrAreaInvalida)
			}
		})
	}
}

func TestReporteService_Listar_ErrorStore(t *testing.T) {
	store := newFakeReporteStore()
	store.listErr = errors.New("db caída")
	svc := NewReporteService(store)

	if _, err := svc.Listar(context.Background(), nil, nil, nil, nil); !errors.Is(err, store.listErr) {
		t.Fatalf("Listar() error = %v, want %v", err, store.listErr)
	}
}

func TestReporteService_AddAvistamientoById(t *testing.T) {
	store := newFakeReporteStore()
	svc := NewReporteService(store)

	creado, err := svc.Crear(context.Background(), uuid.New(), 42, 32.5027, -117.00371, nil)
	if err != nil {
		t.Fatalf("Crear() error = %v", err)
	}
	id := creado.Reporte.ID

	for want := 1; want <= 2; want++ {
		a, err := svc.AgregarAvistamiento(context.Background(), id)
		if err != nil {
			t.Fatalf("AgregarAvistamiento() error = %v", err)
		}
		if a.ID != id || a.Avistamientos != want {
			t.Fatalf("AgregarAvistamiento() = %+v, want id=%v avistamientos=%d", a, id, want)
		}
	}
}

func TestReporteService_AgregarAvistamiento_NoEncontrado(t *testing.T) {
	svc := NewReporteService(newFakeReporteStore())

	_, err := svc.AgregarAvistamiento(context.Background(), uuid.New())
	if !errors.Is(err, domain.ErrReporteNotFound) {
		t.Fatalf("AgregarAvistamiento() error = %v, want %v", err, domain.ErrReporteNotFound)
	}
}
