package service

import (
	"context"
	"errors"
	"slices"
	"testing"
	"time"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/domain"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
)

// fakeReporteStore implementa ReporteStore en memoria.
// CreateReporte imita a la transacción real (reporte + location) y al
// trigger que mantiene puntos_origen, para que Obtener devuelva un detalle
// realista.
// Guarda los últimos parámetros de CreateReporte, ListReportesResumen y
// ListReportesPorUbicacion para revisarlos.
type fakeReporteStore struct {
	byID        map[uuid.UUID]domain.Reporte
	puntos      map[uuid.UUID]domain.GetPuntoOrigenByReporteIdRow
	comentarios map[uuid.UUID][]domain.ListComentariosByReporteIdRow
	multimedia  map[uuid.UUID][]domain.Multimedia
	tags        map[uuid.UUID][]domain.ListTagsByReporteIdRow
	locations   map[uuid.UUID][]domain.Location
	resumen     []domain.ListReportesResumenRow
	cercanos    []domain.ListReportesPorUbicacionRow

	lastArg     domain.CreateReporteTxParams
	lastListArg domain.ListReportesResumenParams
	listCalled  bool

	lastCercanosArg domain.ListReportesPorUbicacionParams

	lastCambiarEstadoArg domain.CambiarEstadoReporteTxParams
	cambiarEstadoCalled  bool

	createErr error
	listErr   error
}

func newFakeReporteStore() *fakeReporteStore {
	return &fakeReporteStore{
		byID:        map[uuid.UUID]domain.Reporte{},
		puntos:      map[uuid.UUID]domain.GetPuntoOrigenByReporteIdRow{},
		comentarios: map[uuid.UUID][]domain.ListComentariosByReporteIdRow{},
		multimedia:  map[uuid.UUID][]domain.Multimedia{},
		tags:        map[uuid.UUID][]domain.ListTagsByReporteIdRow{},
		locations:   map[uuid.UUID][]domain.Location{},
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
		Direccion:   arg.Reporte.Direccion,
	}
	f.byID[r.ID] = r
	f.locations[r.ID] = []domain.Location{
		{ID: 1, ReporteID: r.ID, Latitude: arg.Latitude, Longitude: arg.Longitude, UserID: arg.UserID},
	}
	// Con una sola location, el centroide es esa misma location.
	f.puntos[r.ID] = domain.GetPuntoOrigenByReporteIdRow{Latitude: arg.Latitude, Longitude: arg.Longitude}
	return r, nil
}

// GetReporteById imita el JOIN con incidentes con una etiqueta fija.
func (f *fakeReporteStore) GetReporteById(_ context.Context, id uuid.UUID) (domain.GetReporteByIdRow, error) {
	r, ok := f.byID[id]
	if !ok {
		return domain.GetReporteByIdRow{}, pgx.ErrNoRows
	}
	return domain.GetReporteByIdRow{Reporte: r, IncidenteEtiqueta: "Socavón"}, nil
}

func (f *fakeReporteStore) GetPuntoOrigenByReporteId(_ context.Context, id uuid.UUID) (domain.GetPuntoOrigenByReporteIdRow, error) {
	p, ok := f.puntos[id]
	if !ok {
		return domain.GetPuntoOrigenByReporteIdRow{}, pgx.ErrNoRows
	}
	return p, nil
}

func (f *fakeReporteStore) ListComentariosByReporteId(_ context.Context, id uuid.UUID) ([]domain.ListComentariosByReporteIdRow, error) {
	return f.comentarios[id], nil
}

func (f *fakeReporteStore) ListMultimediaByReporteId(_ context.Context, id uuid.UUID) ([]domain.Multimedia, error) {
	return f.multimedia[id], nil
}

func (f *fakeReporteStore) ListTagsByReporteId(_ context.Context, id uuid.UUID) ([]domain.ListTagsByReporteIdRow, error) {
	return f.tags[id], nil
}

func (f *fakeReporteStore) ListLocationsByReporteId(_ context.Context, id uuid.UUID) ([]domain.Location, error) {
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

func (f *fakeReporteStore) ListReportesPorUbicacion(_ context.Context, arg domain.ListReportesPorUbicacionParams) ([]domain.ListReportesPorUbicacionRow, error) {
	f.lastCercanosArg = arg
	if f.listErr != nil {
		return nil, f.listErr
	}
	return f.cercanos, nil
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

func (f *fakeReporteStore) CambiarEstadoReporte(_ context.Context, arg domain.CambiarEstadoReporteTxParams) (domain.Reporte, error) {
	f.cambiarEstadoCalled = true
	f.lastCambiarEstadoArg = arg
	r, ok := f.byID[arg.ID]
	if !ok {
		return domain.Reporte{}, pgx.ErrNoRows
	}
	r.EstadoActual = arg.Estado
	f.byID[arg.ID] = r
	return r, nil
}

func TestReporteService_Crear(t *testing.T) {
	store := newFakeReporteStore()
	svc := NewReporteService(store)
	userID := uuid.New()

	fakeNuevoReporte := domain.NuevoReporte{
		UserID:      userID,
		Rol:         domain.RolCiudadano,
		IncidenteID: 42,
		Latitude:    32.5027,
		Longitude:   -117.00371,
		EsOficial:   false,
	}

	r, err := svc.Crear(context.Background(), fakeNuevoReporte)
	if err != nil {
		t.Fatalf("Crear() error = %v", err)
	}
	if r.Reporte.IncidenteID != 42 {
		t.Fatalf("Crear() = %+v, want incidenteID=%d", r.Reporte, 42)
	}
	// Crear relee el reporte con Obtener: el detalle ya trae el centroide y la
	// location inicial. La multimedia se sube después, así que empieza vacía.
	if r.Latitude != 32.5027 || r.Longitude != -117.00371 {
		t.Fatalf("Crear() centroide = (%v, %v), want (%v, %v)", r.Latitude, r.Longitude, 32.5027, -117.00371)
	}
	if len(r.Locations) != 1 || len(r.Multimedia) != 0 {
		t.Fatalf("Crear() locations = %v multimedia = %v, want 1 location y ninguna multimedia", r.Locations, r.Multimedia)
	}

	arg := store.lastArg
	if arg.UserID != userID || arg.Latitude != 32.5027 || arg.Longitude != -117.00371 {
		t.Fatalf("CreateReporte() arg = %+v, want userID=%v lat=%v lng=%v", arg, userID, 32.5027, -117.00371)
	}
}

func TestReporteService_Crear_Direccion(t *testing.T) {
	ptr := func(s string) *string { return &s }
	tests := []struct {
		name      string
		direccion *string
		want      *string
	}{
		{"sin dirección", nil, nil},
		{"vacía", ptr(""), nil},
		{"solo espacios", ptr("   "), nil},
		{"con espacios alrededor", ptr("  Av. Revolución 1234 "), ptr("Av. Revolución 1234")},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			store := newFakeReporteStore()
			svc := NewReporteService(store)

			r, err := svc.Crear(context.Background(), domain.NuevoReporte{
				UserID:      uuid.New(),
				Rol:         domain.RolCiudadano,
				IncidenteID: 42,
				Latitude:    32.5027,
				Longitude:   -117.00371,
				Direccion:   tt.direccion,
			})
			if err != nil {
				t.Fatalf("Crear() error = %v", err)
			}
			got := r.Reporte.Direccion
			if (got == nil) != (tt.want == nil) || (got != nil && *got != *tt.want) {
				t.Fatalf("Crear() Direccion = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestReporteService_Crear_EsOficial(t *testing.T) {
	tests := []struct {
		name    string
		rol     string
		wantErr error
	}{
		{"admin puede", "admin", nil},
		{"proteccion_civil puede", "proteccion_civil", nil},
		{"ciudadano no puede", domain.RolCiudadano, domain.ErrOficialNoPermitido},
		{"sin rol no puede", "", domain.ErrOficialNoPermitido},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			store := newFakeReporteStore()
			svc := NewReporteService(store)

			fakeNuevoReporte := domain.NuevoReporte{
				UserID:      uuid.New(),
				Rol:         tt.rol,
				IncidenteID: 42,
				Latitude:    32.5027,
				Longitude:   -117.00371,
				EsOficial:   true,
			}
			r, err := svc.Crear(context.Background(), fakeNuevoReporte)
			if !errors.Is(err, tt.wantErr) {
				t.Fatalf("Crear() error = %v, want %v", err, tt.wantErr)
			}
			if tt.wantErr != nil {
				if len(store.byID) != 0 {
					t.Fatalf("CreateReporte() creó %d reportes, want 0", len(store.byID))
				}
				return
			}
			if !store.lastArg.Reporte.EsOficial || !r.Reporte.EsOficial {
				t.Fatalf("Crear() EsOficial = %v (arg %v), want true", r.Reporte.EsOficial, store.lastArg.Reporte.EsOficial)
			}
		})
	}
}

func TestReporteService_Crear_NoOficialCiudadano(t *testing.T) {
	store := newFakeReporteStore()
	svc := NewReporteService(store)

	fakeNuevoReporte := domain.NuevoReporte{
		UserID:      uuid.New(),
		Rol:         domain.RolCiudadano,
		IncidenteID: 42,
		Latitude:    32.5027,
		Longitude:   -117.00371,
		EsOficial:   false,
	}

	r, err := svc.Crear(context.Background(), fakeNuevoReporte)
	if err != nil {
		t.Fatalf("Crear() error = %v", err)
	}
	if r.Reporte.EsOficial {
		t.Fatalf("Crear() EsOficial = true, want false")
	}
}

func TestReporteService_Crear_IncidenteNoExiste(t *testing.T) {
	store := newFakeReporteStore()
	store.createErr = &pgconn.PgError{Code: "23503", ConstraintName: "reporte_incidente_id_fkey"}
	svc := NewReporteService(store)

	fakeNuevoReporte := domain.NuevoReporte{
		UserID:      uuid.New(),
		Rol:         domain.RolCiudadano,
		IncidenteID: 999,
		Latitude:    32.5027,
		Longitude:   -117.00371,
		EsOficial:   false,
	}

	_, err := svc.Crear(context.Background(), fakeNuevoReporte)
	if !errors.Is(err, domain.ErrIncidenteNotFound) {
		t.Fatalf("Crear() error = %v, want %v", err, domain.ErrIncidenteNotFound)
	}
}

func TestReporteService_Obtener(t *testing.T) {
	store := newFakeReporteStore()
	svc := NewReporteService(store)

	fakeNuevoReporte := domain.NuevoReporte{
		UserID:      uuid.New(),
		Rol:         domain.RolCiudadano,
		IncidenteID: 42,
		Latitude:    32.5027,
		Longitude:   -117.00371,
		EsOficial:   false,
	}

	creado, err := svc.Crear(context.Background(), fakeNuevoReporte)
	if err != nil {
		t.Fatalf("Crear() error = %v", err)
	}
	id := creado.Reporte.ID
	store.comentarios[id] = []domain.ListComentariosByReporteIdRow{{ID: 1, ReporteID: id, Comentario: "sigue ahí", Username: "ana", RolName: "rescatista"}}
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
	if len(r.Comentarios) == 1 && (r.Comentarios[0].Username != "ana" || r.Comentarios[0].RolName != "rescatista") {
		t.Fatalf("Obtener() autor del comentario = %q/%q, want ana/rescatista", r.Comentarios[0].Username, r.Comentarios[0].RolName)
	}
	if len(r.Comentarios) != 1 || len(r.Tags) != 1 || len(r.Locations) != 1 || len(r.Multimedia) != 0 {
		t.Fatalf("Obtener() comentarios=%d tags=%d locations=%d multimedia=%d, want 1, 1, 1, 0",
			len(r.Comentarios), len(r.Tags), len(r.Locations), len(r.Multimedia))
	}
}

func TestReporteService_Obtener_NoEncontrado(t *testing.T) {
	svc := NewReporteService(newFakeReporteStore())

	_, err := svc.Obtener(context.Background(), uuid.New())
	if !errors.Is(err, domain.ErrReporteNotFound) {
		t.Fatalf("Obtener() error = %v, want %v", err, domain.ErrReporteNotFound)
	}
}

// ptr devuelve un puntero al valor, para armar argumentos opcionales.
func ptr[T any](v T) *T { return &v }

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

	fakeNuevoReporte := domain.NuevoReporte{
		UserID:      uuid.New(),
		Rol:         domain.RolCiudadano,
		IncidenteID: 42,
		Latitude:    32.5027,
		Longitude:   -117.00371,
		EsOficial:   false,
	}
	creado, err := svc.Crear(context.Background(), fakeNuevoReporte)
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

func TestReporteService_ListarCercanos_SinFiltros(t *testing.T) {
	store := newFakeReporteStore()
	store.cercanos = []domain.ListReportesPorUbicacionRow{{ID: uuid.New(), DistanciaM: 12.5}}
	svc := NewReporteService(store)

	rows, err := svc.ListarCercanos(context.Background(), -117.0382, 32.5149, 2000, nil, nil, nil, 200)
	if err != nil {
		t.Fatalf("ListarCercanos() error = %v", err)
	}
	if len(rows) != 1 || rows[0].DistanciaM != 12.5 {
		t.Fatalf("ListarCercanos() = %+v, want la fila de la store", rows)
	}
	a := store.lastCercanosArg
	if a.Lng != -117.0382 || a.Lat != 32.5149 || a.Radio != 2000 || a.Limite != 200 {
		t.Fatalf("ListReportesPorUbicacion() arg = %+v, want el punto, radio y límite recibidos", a)
	}
	// nil es lo que la consulta interpreta como "sin filtro".
	if a.IncidenteIds != nil || a.Estados != nil || a.Desde != nil {
		t.Fatalf("ListReportesPorUbicacion() arg = %+v, want filtros nil", a)
	}
}

func TestReporteService_ListarCercanos_ConFiltros(t *testing.T) {
	store := newFakeReporteStore()
	svc := NewReporteService(store)
	desde := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)

	_, err := svc.ListarCercanos(context.Background(), -117.0382, 32.5149, 2000,
		[]int{2, 4}, []domain.Estado{domain.EstadoPendiente, domain.EstadoProbable}, &desde, 10)
	if err != nil {
		t.Fatalf("ListarCercanos() error = %v", err)
	}
	a := store.lastCercanosArg
	if !slices.Equal(a.IncidenteIds, []int{2, 4}) ||
		!slices.Equal(a.Estados, []string{"Pendiente", "Probable"}) ||
		a.Desde == nil || !a.Desde.Equal(desde) || a.Limite != 10 {
		t.Fatalf("ListReportesPorUbicacion() arg = %+v, want los filtros recibidos", a)
	}
}

func TestReporteService_ListarCercanos_ErrorDeStore(t *testing.T) {
	store := newFakeReporteStore()
	store.listErr = errors.New("db caída")
	svc := NewReporteService(store)

	if _, err := svc.ListarCercanos(context.Background(), -117.0382, 32.5149, 2000, nil, nil, nil, 200); !errors.Is(err, store.listErr) {
		t.Fatalf("ListarCercanos() error = %v, want %v", err, store.listErr)
	}
}

func TestReporteService_CambiarEstado_Rol(t *testing.T) {
	tests := []struct {
		rol     string
		wantErr error
	}{
		{"", domain.ErrEstadoNoPermitido},
		{domain.RolCiudadano, domain.ErrEstadoNoPermitido},
		{"admin", nil},
		{"rescatista", nil},
		// Un rol que no existe en el baseline también puede: solo se excluye ciudadano.
		{"rol_nuevo", nil},
	}
	for _, tt := range tests {
		t.Run("rol "+tt.rol, func(t *testing.T) {
			store := newFakeReporteStore()
			svc := NewReporteService(store)
			creado, err := svc.Crear(context.Background(), domain.NuevoReporte{
				UserID: uuid.New(), Rol: domain.RolCiudadano, IncidenteID: 42, Latitude: 32.5, Longitude: -117,
			})
			if err != nil {
				t.Fatalf("Crear() error = %v", err)
			}

			actorID := uuid.New()
			r, err := svc.CambiarEstado(context.Background(), tt.rol, actorID, creado.Reporte.ID, domain.EstadoVerificado)
			if !errors.Is(err, tt.wantErr) {
				t.Fatalf("CambiarEstado() error = %v, want %v", err, tt.wantErr)
			}
			// Un rol sin permiso no debe llegar a la store (ni dejar historial).
			if store.cambiarEstadoCalled != (tt.wantErr == nil) {
				t.Fatalf("CambiarEstadoReporte llamado = %v, want %v", store.cambiarEstadoCalled, tt.wantErr == nil)
			}
			if tt.wantErr == nil {
				want := domain.CambiarEstadoReporteTxParams{ID: creado.Reporte.ID, Estado: domain.EstadoVerificado, ActorID: actorID}
				if store.lastCambiarEstadoArg != want {
					t.Fatalf("CambiarEstadoReporte recibió %+v, want %+v", store.lastCambiarEstadoArg, want)
				}
			}
			want := domain.EstadoVerificado
			if tt.wantErr != nil {
				r.Reporte = store.byID[creado.Reporte.ID]
				want = creado.Reporte.EstadoActual
			}
			if r.Reporte.EstadoActual != want {
				t.Fatalf("estado = %q, want %q", r.Reporte.EstadoActual, want)
			}
		})
	}
}

func TestReporteService_CambiarEstado_NoEncontrado(t *testing.T) {
	svc := NewReporteService(newFakeReporteStore())

	_, err := svc.CambiarEstado(context.Background(), "admin", uuid.New(), uuid.New(), domain.EstadoVerificado)
	if !errors.Is(err, domain.ErrReporteNotFound) {
		t.Fatalf("CambiarEstado() error = %v, want %v", err, domain.ErrReporteNotFound)
	}
}
