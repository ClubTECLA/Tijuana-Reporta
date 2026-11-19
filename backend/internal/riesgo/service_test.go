package riesgo

import (
	"context"
	"errors"
	"math"
	"reflect"
	"testing"
	"time"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/db/sqlc"
)

// fakeStore devuelve filas fijas y guarda los parámetros recibidos para
// comprobar que el servicio pasa los filtros tal cual.
type fakeStore struct {
	celdas     []sqlc.ListCeldasCalorRow
	zonas      []sqlc.ListZonasRiesgoRow
	colonias   []sqlc.ListColoniasHistoricoRow
	categorias []sqlc.ListConteoCategoriasRow
	err        error

	argCeldas     *sqlc.ListCeldasCalorParams
	argZonas      *sqlc.ListZonasRiesgoParams
	argColonias   *sqlc.ListColoniasHistoricoParams
	argCategorias *sqlc.ListConteoCategoriasParams
}

func (f *fakeStore) ListCeldasCalor(ctx context.Context, arg sqlc.ListCeldasCalorParams) ([]sqlc.ListCeldasCalorRow, error) {
	f.argCeldas = &arg
	return f.celdas, f.err
}

func (f *fakeStore) ListZonasRiesgo(ctx context.Context, arg sqlc.ListZonasRiesgoParams) ([]sqlc.ListZonasRiesgoRow, error) {
	f.argZonas = &arg
	return f.zonas, f.err
}

func (f *fakeStore) ListColoniasHistorico(ctx context.Context, arg sqlc.ListColoniasHistoricoParams) ([]sqlc.ListColoniasHistoricoRow, error) {
	f.argColonias = &arg
	return f.colonias, f.err
}

func (f *fakeStore) ListConteoCategorias(ctx context.Context, arg sqlc.ListConteoCategoriasParams) ([]sqlc.ListConteoCategoriasRow, error) {
	f.argCategorias = &arg
	return f.categorias, f.err
}

var areaTijuana = Area{MinLat: 32.4, MaxLat: 32.6, MinLng: -117.2, MaxLng: -116.8}

func fecha(s string) *time.Time {
	t, err := time.Parse(time.RFC3339, s)
	if err != nil {
		panic(err)
	}
	return &t
}

func TestTamanoCelda(t *testing.T) {
	casos := []struct {
		zoom float64
		want float64
	}{
		{0, CeldaMaxM},  // muy alejado: tope superior
		{10, 4126},      // 132030 / 1024 × 32
		{13, 515.7},     // 132030 / 8192 × 32
		{16, 64.47},     // 132030 / 65536 × 32
		{22, CeldaMinM}, // muy cerca: tope inferior
	}
	for _, c := range casos {
		if got := TamanoCelda(c.zoom); math.Abs(got-c.want) > 1 {
			t.Errorf("TamanoCelda(%v) = %v, want ≈ %v", c.zoom, got, c.want)
		}
	}
}

func TestScoreYNivel(t *testing.T) {
	casos := []struct {
		peso, max float64
		score     float64
		nivel     Nivel
	}{
		{10, 10, 1, NivelAlto},
		{6.6, 10, 0.66, NivelAlto},
		{6.5, 10, 0.65, NivelMedio},
		{3.3, 10, 0.33, NivelMedio},
		{3, 10, 0.3, NivelBajo},
		{0, 10, 0, NivelBajo},
		{5, 0, 0, NivelBajo}, // sin máximo no hay score
	}
	for _, c := range casos {
		s := Score(c.peso, c.max)
		if math.Abs(s-c.score) > 1e-9 {
			t.Errorf("Score(%v, %v) = %v, want %v", c.peso, c.max, s, c.score)
		}
		if n := NivelDe(s); n != c.nivel {
			t.Errorf("NivelDe(%v) = %v, want %v", s, n, c.nivel)
		}
	}
}

func TestService_ObtenerMapaCalor(t *testing.T) {
	f := &fakeStore{celdas: []sqlc.ListCeldasCalorRow{
		{Latitude: 32.5, Longitude: -117, Peso: 2.5, Reportes: 3},
		{Latitude: 32.51, Longitude: -117.01, Peso: 7, Reportes: 7},
	}}
	svc := NewService(f)
	filtro := Filtro{IncidenteIDs: []int{1, 6}, Desde: fecha("2025-01-01T00:00:00Z"), Hasta: fecha("2026-01-01T00:00:00Z")}

	mapa, err := svc.ObtenerMapaCalor(t.Context(), areaTijuana, 13, filtro)
	if err != nil {
		t.Fatalf("ObtenerMapaCalor() error = %v", err)
	}
	if mapa.PesoMaximo != 7 {
		t.Errorf("PesoMaximo = %v, want 7", mapa.PesoMaximo)
	}
	if len(mapa.Celdas) != 2 || mapa.Celdas[0].Reportes != 3 {
		t.Errorf("Celdas = %+v, want las 2 filas del store", mapa.Celdas)
	}
	if mapa.TamanoCeldaM != TamanoCelda(13) {
		t.Errorf("TamanoCeldaM = %v, want %v", mapa.TamanoCeldaM, TamanoCelda(13))
	}

	want := sqlc.ListCeldasCalorParams{
		TamanoCeldaM: TamanoCelda(13),
		MinLng:       -117.2, MinLat: 32.4, MaxLng: -116.8, MaxLat: 32.6,
		IncidenteIds: []int{1, 6},
		Desde:        filtro.Desde,
		Hasta:        filtro.Hasta,
	}
	if !reflect.DeepEqual(*f.argCeldas, want) {
		t.Errorf("ListCeldasCalor() arg = %+v, want %+v", *f.argCeldas, want)
	}
}

func TestService_ObtenerMapaCalor_SinCeldas(t *testing.T) {
	svc := NewService(&fakeStore{})
	mapa, err := svc.ObtenerMapaCalor(t.Context(), areaTijuana, 12, Filtro{IncidenteIDs: []int{}})
	if err != nil {
		t.Fatalf("ObtenerMapaCalor() error = %v", err)
	}
	if mapa.Celdas == nil || len(mapa.Celdas) != 0 || mapa.PesoMaximo != 0 {
		t.Errorf("ObtenerMapaCalor() = %+v, want celdas vacías (no nil) y peso 0", mapa)
	}
}

func TestService_IncidentesVaciosEsSinFiltro(t *testing.T) {
	f := &fakeStore{}
	svc := NewService(f)
	if _, err := svc.ObtenerMapaCalor(t.Context(), areaTijuana, 12, Filtro{IncidenteIDs: []int{}}); err != nil {
		t.Fatal(err)
	}
	if _, err := svc.ObtenerResumen(t.Context(), Filtro{IncidenteIDs: []int{}}); err != nil {
		t.Fatal(err)
	}
	if f.argCeldas.IncidenteIds != nil || f.argZonas.IncidenteIds != nil ||
		f.argColonias.IncidenteIds != nil || f.argCategorias.IncidenteIds != nil {
		t.Errorf("IncidenteIds = [] llegó como arreglo vacío, want nil (sin filtro)")
	}
}

func TestService_Validaciones(t *testing.T) {
	svc := NewService(&fakeStore{})
	ctx := t.Context()

	invertida := Area{MinLat: 32.6, MaxLat: 32.4, MinLng: -117.2, MaxLng: -116.8}
	if _, err := svc.ObtenerMapaCalor(ctx, invertida, 12, Filtro{}); !errors.Is(err, ErrAreaInvalida) {
		t.Errorf("ObtenerMapaCalor(lat invertida) = %v, want ErrAreaInvalida", err)
	}
	invertida = Area{MinLat: 32.4, MaxLat: 32.6, MinLng: -116.8, MaxLng: -117.2}
	if _, err := svc.ObtenerMapaCalor(ctx, invertida, 12, Filtro{}); !errors.Is(err, ErrAreaInvalida) {
		t.Errorf("ObtenerMapaCalor(lng invertida) = %v, want ErrAreaInvalida", err)
	}

	periodo := Filtro{Desde: fecha("2026-02-01T00:00:00Z"), Hasta: fecha("2026-01-01T00:00:00Z")}
	if _, err := svc.ObtenerMapaCalor(ctx, areaTijuana, 12, periodo); !errors.Is(err, ErrPeriodoInvalido) {
		t.Errorf("ObtenerMapaCalor(periodo invertido) = %v, want ErrPeriodoInvalido", err)
	}
	if _, err := svc.ObtenerResumen(ctx, periodo); !errors.Is(err, ErrPeriodoInvalido) {
		t.Errorf("ObtenerResumen(periodo invertido) = %v, want ErrPeriodoInvalido", err)
	}

	mismoDia := Filtro{Desde: fecha("2026-01-01T00:00:00Z"), Hasta: fecha("2026-01-01T00:00:00Z")}
	if _, err := svc.ObtenerResumen(ctx, mismoDia); err != nil {
		t.Errorf("ObtenerResumen(desde == hasta) = %v, want nil", err)
	}
}

func TestService_ObtenerResumen(t *testing.T) {
	f := &fakeStore{
		zonas: []sqlc.ListZonasRiesgoRow{
			{Latitude: 32.5, Longitude: -117, RadioM: 300, Colonia: "Cañón del Sáinz", Reportes: 12, Peso: 12},
			{Latitude: 32.4, Longitude: -116.9, RadioM: 200, Colonia: "", Reportes: 6, Peso: 5},
			{Latitude: 32.3, Longitude: -116.8, RadioM: 150, Colonia: "Obrera", Reportes: 4, Peso: 2},
		},
		colonias: []sqlc.ListColoniasHistoricoRow{
			{Colonia: "Bustamante", Reportes: 8, Peso: 8},
			{Colonia: "La Morita", Reportes: 6, Peso: 6},
		},
		categorias: []sqlc.ListConteoCategoriasRow{
			{IncidenteID: 1, Total: 350},
			{IncidenteID: 2, Total: 27},
		},
	}
	svc := NewService(f)
	ahora := time.Date(2026, 11, 16, 12, 0, 0, 0, time.UTC)
	svc.ahora = func() time.Time { return ahora }

	filtro := Filtro{IncidenteIDs: []int{1}, Desde: fecha("2026-01-01T00:00:00Z")}
	r, err := svc.ObtenerResumen(t.Context(), filtro)
	if err != nil {
		t.Fatalf("ObtenerResumen() error = %v", err)
	}

	if !r.GeneradoEn.Equal(ahora) || r.VersionModelo != VersionModelo {
		t.Errorf("GeneradoEn, VersionModelo = %v, %v, want %v, %v", r.GeneradoEn, r.VersionModelo, ahora, VersionModelo)
	}
	if r.TotalHistoricos != 377 {
		t.Errorf("TotalHistoricos = %v, want 377 (suma de categorías)", r.TotalHistoricos)
	}

	wantZonas := []struct {
		nombre string
		nivel  Nivel
	}{
		{"Cañón del Sáinz", NivelAlto},     // 12/12
		{NombreZonaSinColonia, NivelMedio}, // 5/12 = 0.42
		{"Obrera", NivelBajo},              // 2/12 = 0.17
	}
	if len(r.Zonas) != len(wantZonas) {
		t.Fatalf("len(Zonas) = %d, want %d", len(r.Zonas), len(wantZonas))
	}
	for i, w := range wantZonas {
		if r.Zonas[i].Nombre != w.nombre || r.Zonas[i].Nivel != w.nivel {
			t.Errorf("Zonas[%d] = %q %v, want %q %v", i, r.Zonas[i].Nombre, r.Zonas[i].Nivel, w.nombre, w.nivel)
		}
	}
	if r.ZonasAltoRiesgo != 1 {
		t.Errorf("ZonasAltoRiesgo = %v, want 1", r.ZonasAltoRiesgo)
	}
	if r.Zonas[0].RadioM != 300 || r.Zonas[0].Reportes != 12 {
		t.Errorf("Zonas[0] = %+v, want radio 300 y 12 reportes", r.Zonas[0])
	}

	if len(r.Colonias) != 2 || r.Colonias[0].Score != 1 || r.Colonias[1].Nivel != NivelAlto {
		t.Errorf("Colonias = %+v, want Bustamante 1.0 y La Morita 0.75 (Alto)", r.Colonias)
	}
	if len(r.Categorias) != 2 || r.Categorias[0] != (ConteoCategoria{IncidenteID: 1, Total: 350}) {
		t.Errorf("Categorias = %+v", r.Categorias)
	}

	// Parámetros del modelo y filtros, tal cual.
	if a := f.argZonas; a.EpsM != EpsM || a.MinPuntos != MinPuntos || a.Limite != LimiteZonas ||
		!reflect.DeepEqual(a.IncidenteIds, []int{1}) || a.Desde != filtro.Desde || a.Hasta != nil {
		t.Errorf("ListZonasRiesgo() arg = %+v", *a)
	}
	if a := f.argColonias; a.Limite != LimiteColonias || a.Desde != filtro.Desde {
		t.Errorf("ListColoniasHistorico() arg = %+v", *a)
	}
	if a := f.argCategorias; !reflect.DeepEqual(a.IncidenteIds, []int{1}) || a.Desde != filtro.Desde {
		t.Errorf("ListConteoCategorias() arg = %+v", *a)
	}
}

func TestService_ObtenerResumen_Vacio(t *testing.T) {
	r, err := NewService(&fakeStore{}).ObtenerResumen(t.Context(), Filtro{})
	if err != nil {
		t.Fatalf("ObtenerResumen() error = %v", err)
	}
	if r.Zonas == nil || r.Colonias == nil || r.Categorias == nil {
		t.Errorf("ObtenerResumen() = %+v, want listas vacías (no nil) para que el JSON lleve []", r)
	}
	if r.TotalHistoricos != 0 || r.ZonasAltoRiesgo != 0 {
		t.Errorf("totales = %d, %d, want 0, 0", r.TotalHistoricos, r.ZonasAltoRiesgo)
	}
}

func TestService_ErrorDelStore(t *testing.T) {
	boom := errors.New("conexión perdida")
	svc := NewService(&fakeStore{err: boom})
	if _, err := svc.ObtenerMapaCalor(t.Context(), areaTijuana, 12, Filtro{}); !errors.Is(err, boom) {
		t.Errorf("ObtenerMapaCalor() = %v, want el error del store", err)
	}
	if _, err := svc.ObtenerResumen(t.Context(), Filtro{}); !errors.Is(err, boom) {
		t.Errorf("ObtenerResumen() = %v, want el error del store", err)
	}
}
