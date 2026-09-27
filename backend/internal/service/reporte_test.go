package service

import (
	"context"
	"errors"
	"testing"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/domain"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// fakeReporteStore implementa ReporteStore en memoria y guarda los últimos
// parámetros recibidos por CreateReporte para poder revisarlos.
type fakeReporteStore struct {
	byID    map[uuid.UUID]domain.Reporte
	lastArg domain.CreateReporteTxParams
}

func newFakeReporteStore() *fakeReporteStore {
	return &fakeReporteStore{byID: map[uuid.UUID]domain.Reporte{}}
}

func (f *fakeReporteStore) CreateReporte(_ context.Context, arg domain.CreateReporteTxParams) (domain.Reporte, error) {
	f.lastArg = arg
	r := domain.Reporte{
		ID:          uuid.New(),
		IncidenteID: arg.Reporte.IncidenteID,
		EsOficial:   arg.Reporte.EsOficial,
	}
	f.byID[r.ID] = r
	return r, nil
}

func (f *fakeReporteStore) GetReporteById(_ context.Context, id uuid.UUID) (domain.Reporte, error) {
	r, ok := f.byID[id]
	if !ok {
		return domain.Reporte{}, pgx.ErrNoRows
	}
	return r, nil
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
	if r.IncidenteID != 42 {
		t.Fatalf("Crear() = %+v, want incidenteID=%d", r, 42)
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

func TestReporteService_Obtener(t *testing.T) {
	svc := NewReporteService(newFakeReporteStore())

	creado, err := svc.Crear(context.Background(), uuid.New(), 42, 32.5027, -117.00371, nil)
	if err != nil {
		t.Fatalf("Crear() error = %v", err)
	}

	r, err := svc.Obtener(context.Background(), creado.ID)
	if err != nil {
		t.Fatalf("Obtener() error = %v", err)
	}
	if r.ID != creado.ID || r.IncidenteID != 42 {
		t.Fatalf("Obtener() = %+v, want id=%v incidenteID=%d", r, creado.ID, 42)
	}
}

func TestReporteService_Obtener_NoEncontrado(t *testing.T) {
	svc := NewReporteService(newFakeReporteStore())

	_, err := svc.Obtener(context.Background(), uuid.New())
	if !errors.Is(err, domain.ErrReporteNotFound) {
		t.Fatalf("Obtener() error = %v, want %v", err, domain.ErrReporteNotFound)
	}
}
