package mantenimiento

import (
	"context"
	"errors"
	"fmt"
	"slices"
	"testing"
	"time"

	"github.com/ClubTECLA/cimalert/backend/internal/almacen"
	"github.com/ClubTECLA/cimalert/backend/internal/db/sqlc"
	"github.com/jackc/pgx/v5"
)

// ahoraTest es la hora a la que corren las pasadas de los tests.
var ahoraTest = time.Date(2026, 11, 5, 3, 0, 0, 0, time.UTC)

// archivoFalso es un archivo del disco falso.
type archivoFalso struct {
	motivo     string
	modificado time.Time
}

// mundo es el disco de multimedia y la base juntos, en memoria. Cumple store y Cliente.
type mundo struct {
	disco      map[string]archivoFalso
	cuarentena []string
	filas      map[string]time.Time // ruta -> created_at
	corte      *time.Time

	cortesGuardados []time.Time
	purgadoAntes    time.Time
	purgas          int

	errArchivos   error
	errBorrarFila error
	errCuarentena map[string]error
}

// inicioVentanaTest es el corte que se guarda en la primera pasada, antes de revisar nada.
var inicioVentanaTest = ahoraTest.Add(-antiguedadMinima - ventanaInicial)

// sinAvanzar dice si el corte sigue donde empezó la primera pasada.
func (m *mundo) sinAvanzar() bool {
	return m.corte == nil || m.corte.Equal(inicioVentanaTest)
}

func nuevoMundo() *mundo {
	return &mundo{
		disco:         map[string]archivoFalso{},
		filas:         map[string]time.Time{},
		errCuarentena: map[string]error{},
	}
}

// subir agrega un archivo y, si conFila, su fila, los dos creados hace antiguedad.
func (m *mundo) subir(ruta string, antiguedad time.Duration, motivo string, conFila bool) {
	creado := ahoraTest.Add(-antiguedad)
	m.disco[ruta] = archivoFalso{motivo: motivo, modificado: creado}
	if conFila {
		m.filas[ruta] = creado
	}
}

func (m *mundo) GetCorteMantenimiento(ctx context.Context, nombre string) (time.Time, error) {
	if m.corte == nil {
		return time.Time{}, pgx.ErrNoRows
	}
	return *m.corte, nil
}

func (m *mundo) SetCorteMantenimiento(ctx context.Context, arg sqlc.SetCorteMantenimientoParams) error {
	m.corte = &arg.UltimoCorte
	m.cortesGuardados = append(m.cortesGuardados, arg.UltimoCorte)
	return nil
}

func (m *mundo) ListMultimediaPathsExistentes(ctx context.Context, paths []string) ([]string, error) {
	var got []string
	for _, p := range paths {
		if _, ok := m.filas[p]; ok {
			got = append(got, p)
		}
	}
	return got, nil
}

func (m *mundo) ListMultimediaPathsCreadas(ctx context.Context, arg sqlc.ListMultimediaPathsCreadasParams) ([]string, error) {
	var got []string
	for p, creada := range m.filas {
		if !creada.Before(arg.Desde) && creada.Before(arg.Hasta) {
			got = append(got, p)
		}
	}
	return got, nil
}

func (m *mundo) DeleteMultimediaPorPaths(ctx context.Context, paths []string) (int64, error) {
	if m.errBorrarFila != nil {
		return 0, m.errBorrarFila
	}
	var n int64
	for _, p := range paths {
		if _, ok := m.filas[p]; ok {
			delete(m.filas, p)
			n++
		}
	}
	return n, nil
}

func (m *mundo) Archivos(ctx context.Context, desde, hasta time.Time) ([]almacen.Archivo, error) {
	if m.errArchivos != nil {
		return nil, m.errArchivos
	}
	var got []almacen.Archivo
	for ruta, a := range m.disco {
		if !a.modificado.Before(desde) && a.modificado.Before(hasta) {
			got = append(got, almacen.Archivo{Path: ruta, Motivo: a.motivo})
		}
	}
	return got, nil
}

func (m *mundo) Faltan(ctx context.Context, paths []string) ([]string, error) {
	var got []string
	for _, p := range paths {
		if _, ok := m.disco[p]; !ok {
			got = append(got, p)
		}
	}
	return got, nil
}

func (m *mundo) Cuarentena(ctx context.Context, path string) error {
	if err := m.errCuarentena[path]; err != nil {
		return err
	}
	delete(m.disco, path)
	m.cuarentena = append(m.cuarentena, path)
	return nil
}

func (m *mundo) PurgarCuarentena(ctx context.Context, antes time.Time) (int, error) {
	m.purgas++
	m.purgadoAntes = antes
	return 0, nil
}

// nuevoJob arma un Job sobre un mundo vacío, con la hora fija en ahoraTest.
func nuevoJob() (*Job, *mundo) {
	m := nuevoMundo()
	j := New(m, m, Opciones{Hora: 3, MaxAcciones: 20, CuarentenaDias: 15})
	j.ahora = func() time.Time { return ahoraTest }
	return j, m
}

// rutaDe arma la ruta de un archivo de prueba.
func rutaDe(nombre string) string { return "reportes/abc/" + nombre + ".jpg" }

func TestPasar_NoTocaLoQueEstaBien(t *testing.T) {
	j, m := nuevoJob()
	m.subir(rutaDe("ok"), 5*time.Hour, "", true)

	if err := j.Pasar(context.Background()); err != nil {
		t.Fatalf("Pasar() = %v, want nil", err)
	}

	if len(m.cuarentena) != 0 || len(m.filas) != 1 || len(m.disco) != 1 {
		t.Errorf("cuarentena = %v, filas = %d, disco = %d, want nada tocado", m.cuarentena, len(m.filas), len(m.disco))
	}
}

func TestPasar_ArchivoInvalidoVaACuarentenaYSuFilaSeBorra(t *testing.T) {
	j, m := nuevoJob()
	m.subir(rutaDe("mal"), 5*time.Hour, "no es JPEG", true)
	m.subir(rutaDe("ok"), 5*time.Hour, "", true)

	if err := j.Pasar(context.Background()); err != nil {
		t.Fatalf("Pasar() = %v, want nil", err)
	}

	if !slices.Equal(m.cuarentena, []string{rutaDe("mal")}) {
		t.Errorf("cuarentena = %v, want [%s]", m.cuarentena, rutaDe("mal"))
	}
	if _, ok := m.filas[rutaDe("mal")]; ok {
		t.Error("la fila del archivo inválido sigue en la base")
	}
	if _, ok := m.filas[rutaDe("ok")]; !ok {
		t.Error("la fila del archivo válido se borró")
	}
}

func TestPasar_ArchivoSinFilaVaACuarentena(t *testing.T) {
	j, m := nuevoJob()
	m.subir(rutaDe("huerfano"), 5*time.Hour, "", false)

	if err := j.Pasar(context.Background()); err != nil {
		t.Fatalf("Pasar() = %v, want nil", err)
	}

	if !slices.Equal(m.cuarentena, []string{rutaDe("huerfano")}) {
		t.Errorf("cuarentena = %v, want [%s]", m.cuarentena, rutaDe("huerfano"))
	}
}

func TestPasar_FilaSinArchivoSeBorra(t *testing.T) {
	j, m := nuevoJob()
	m.filas[rutaDe("perdido")] = ahoraTest.Add(-5 * time.Hour)

	if err := j.Pasar(context.Background()); err != nil {
		t.Fatalf("Pasar() = %v, want nil", err)
	}

	if len(m.filas) != 0 {
		t.Errorf("filas = %v, want ninguna", m.filas)
	}
}

func TestPasar_NoTocaUnaSubidaEnCurso(t *testing.T) {
	j, m := nuevoJob()
	// Archivo guardado hace 30 minutos y todavía sin fila: el backend está por insertarla.
	m.subir(rutaDe("reciente"), 30*time.Minute, "", false)

	if err := j.Pasar(context.Background()); err != nil {
		t.Fatalf("Pasar() = %v, want nil", err)
	}

	if len(m.cuarentena) != 0 {
		t.Errorf("cuarentena = %v, want vacía: una subida reciente no se toca", m.cuarentena)
	}
}

func TestPasar_AvanzaElCorteHastaUnaHoraAntes(t *testing.T) {
	j, m := nuevoJob()

	if err := j.Pasar(context.Background()); err != nil {
		t.Fatalf("Pasar() = %v, want nil", err)
	}

	want := ahoraTest.Add(-antiguedadMinima)
	if m.corte == nil || !m.corte.Equal(want) {
		t.Errorf("corte = %v, want %v", m.corte, want)
	}
}

func TestPasar_LaPrimeraVezSoloMiraLasUltimas24Horas(t *testing.T) {
	j, m := nuevoJob()
	m.subir(rutaDe("viejo"), 30*time.Hour, "", false) // antes de la ventana inicial
	m.subir(rutaDe("nuevo"), 10*time.Hour, "", false)

	if err := j.Pasar(context.Background()); err != nil {
		t.Fatalf("Pasar() = %v, want nil", err)
	}

	if !slices.Equal(m.cuarentena, []string{rutaDe("nuevo")}) {
		t.Errorf("cuarentena = %v, want solo [%s]", m.cuarentena, rutaDe("nuevo"))
	}
}

func TestPasar_UnDiaPerdidoSeCubreEnLaSiguientePasada(t *testing.T) {
	j, m := nuevoJob()
	corte := ahoraTest.Add(-48 * time.Hour) // la pasada de ayer no corrió
	m.corte = &corte
	m.subir(rutaDe("anteayer"), 40*time.Hour, "", false)
	m.subir(rutaDe("ayer"), 10*time.Hour, "", false)

	if err := j.Pasar(context.Background()); err != nil {
		t.Fatalf("Pasar() = %v, want nil", err)
	}

	if len(m.cuarentena) != 2 {
		t.Errorf("cuarentena = %v, want los dos archivos de la ventana de dos días", m.cuarentena)
	}
}

func TestPasar_SinNadaNuevoNoHaceNada(t *testing.T) {
	j, m := nuevoJob()
	corte := ahoraTest.Add(-antiguedadMinima) // ya se revisó hasta aquí
	m.corte = &corte

	if err := j.Pasar(context.Background()); err != nil {
		t.Fatalf("Pasar() = %v, want nil", err)
	}

	if len(m.cortesGuardados) != 0 {
		t.Errorf("cortes guardados = %v, want ninguno", m.cortesGuardados)
	}
}

func TestPasar_FrenoPorDemasiadasAcciones(t *testing.T) {
	j, m := nuevoJob()
	j.op.MaxAcciones = 2
	for _, n := range []string{"a", "b", "c"} {
		m.subir(rutaDe(n), 5*time.Hour, "no es JPEG", true)
	}

	err := j.Pasar(context.Background())

	if !errors.Is(err, ErrFreno) {
		t.Fatalf("Pasar() = %v, want ErrFreno", err)
	}
	if len(m.cuarentena) != 0 || len(m.filas) != 3 {
		t.Errorf("cuarentena = %v, filas = %d, want nada tocado", m.cuarentena, len(m.filas))
	}
	if !m.sinAvanzar() {
		t.Errorf("corte = %v, want sin avanzar de %v", m.corte, inicioVentanaTest)
	}
}

func TestPasar_FrenoSiLaMitadDeLasFilasNoTieneArchivo(t *testing.T) {
	j, m := nuevoJob()
	for i := range 5 {
		m.filas[rutaDe("perdido"+string(rune('a'+i)))] = ahoraTest.Add(-5 * time.Hour)
		m.subir(rutaDe("ok"+string(rune('a'+i))), 5*time.Hour, "", true)
	}

	err := j.Pasar(context.Background())

	if !errors.Is(err, ErrFreno) {
		t.Fatalf("Pasar() = %v, want ErrFreno (5 de 10 filas sin archivo)", err)
	}
	if len(m.filas) != 10 {
		t.Errorf("filas = %d, want 10: no se debe borrar nada", len(m.filas))
	}
}

func TestPasar_UnaFilaSinArchivoNoActivaElFrenoPorProporcion(t *testing.T) {
	j, m := nuevoJob()
	m.filas[rutaDe("perdido")] = ahoraTest.Add(-5 * time.Hour) // 1 de 1: son pocas para decir algo

	if err := j.Pasar(context.Background()); err != nil {
		t.Fatalf("Pasar() = %v, want nil", err)
	}
	if len(m.filas) != 0 {
		t.Errorf("filas = %v, want ninguna", m.filas)
	}
}

func TestPasar_ErrorAlMandarACuarentenaNoAvanzaElCorte(t *testing.T) {
	j, m := nuevoJob()
	m.subir(rutaDe("falla"), 5*time.Hour, "no es JPEG", true)
	m.subir(rutaDe("bien"), 6*time.Hour, "no es JPEG", true)
	m.errCuarentena[rutaDe("falla")] = errors.New("disco lleno")

	err := j.Pasar(context.Background())

	if err == nil {
		t.Fatal("Pasar() = nil, want error")
	}
	if !m.sinAvanzar() {
		t.Errorf("corte = %v, want sin avanzar de %v", m.corte, inicioVentanaTest)
	}
	if _, ok := m.filas[rutaDe("falla")]; !ok {
		t.Error("la fila del archivo que no se pudo apartar se borró")
	}
	if _, ok := m.filas[rutaDe("bien")]; ok {
		t.Error("el otro archivo debía procesarse aunque el primero fallara")
	}
}

func TestPasar_SiFallaBorrarLaFilaLaSiguientePasadaLaLimpia(t *testing.T) {
	j, m := nuevoJob()
	m.subir(rutaDe("mal"), 5*time.Hour, "no es JPEG", true)
	m.errBorrarFila = errors.New("base caída")

	if err := j.Pasar(context.Background()); err == nil {
		t.Fatal("Pasar() = nil, want error")
	}
	if !m.sinAvanzar() {
		t.Fatalf("corte = %v, want sin avanzar de %v", m.corte, inicioVentanaTest)
	}

	// La base vuelve: el archivo ya está en cuarentena y su fila quedó sin archivo.
	m.errBorrarFila = nil
	if err := j.Pasar(context.Background()); err != nil {
		t.Fatalf("segunda Pasar() = %v, want nil", err)
	}
	if len(m.filas) != 0 {
		t.Errorf("filas = %v, want ninguna tras la segunda pasada", m.filas)
	}
}

func TestPasar_VaciaLaCuarentenaVieja(t *testing.T) {
	j, m := nuevoJob()

	if err := j.Pasar(context.Background()); err != nil {
		t.Fatalf("Pasar() = %v, want nil", err)
	}

	want := ahoraTest.AddDate(0, 0, -15)
	if m.purgas != 1 || !m.purgadoAntes.Equal(want) {
		t.Errorf("purgas = %d antes = %v, want 1 antes de %v", m.purgas, m.purgadoAntes, want)
	}
}

func TestPasar_ErrorDeMultimediaDevuelveError(t *testing.T) {
	j, m := nuevoJob()
	m.errArchivos = errors.New("multimedia caído")

	if err := j.Pasar(context.Background()); err == nil {
		t.Fatal("Pasar() = nil, want error")
	}
	if !m.sinAvanzar() || m.purgas != 0 {
		t.Errorf("corte = %v, purgas = %d, want nada avanzado", m.corte, m.purgas)
	}
}

func TestProximaEjecucion(t *testing.T) {
	tests := []struct {
		name  string
		ahora time.Time
		want  time.Time
	}{
		{name: "antes de la hora: hoy", ahora: time.Date(2026, 11, 5, 1, 0, 0, 0, time.UTC), want: time.Date(2026, 11, 5, 3, 0, 0, 0, time.UTC)},
		{name: "justo a la hora: mañana", ahora: time.Date(2026, 11, 5, 3, 0, 0, 0, time.UTC), want: time.Date(2026, 11, 6, 3, 0, 0, 0, time.UTC)},
		{name: "después de la hora: mañana", ahora: time.Date(2026, 11, 5, 10, 0, 0, 0, time.UTC), want: time.Date(2026, 11, 6, 3, 0, 0, 0, time.UTC)},
		{name: "fin de mes", ahora: time.Date(2026, 11, 30, 10, 0, 0, 0, time.UTC), want: time.Date(2026, 12, 1, 3, 0, 0, 0, time.UTC)},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := proximaEjecucion(tt.ahora, 3, 0); !got.Equal(tt.want) {
				t.Errorf("proximaEjecucion(%v) = %v, want %v", tt.ahora, got, tt.want)
			}
		})
	}
}

func TestCorrerConReintentos_ReintentaCadaHoraHastaQueSaleBien(t *testing.T) {
	j, m := nuevoJob()
	m.errArchivos = errors.New("multimedia caído")
	var esperas []time.Duration
	j.esperar = func(ctx context.Context, d time.Duration) error {
		esperas = append(esperas, d)
		if len(esperas) == 2 {
			m.errArchivos = nil // multimedia vuelve antes del tercer intento
		}
		return nil
	}

	j.correrConReintentos(context.Background())

	if len(esperas) != 2 || esperas[0] != reintento || esperas[1] != reintento {
		t.Errorf("esperas = %v, want dos de %v", esperas, reintento)
	}
	if m.corte == nil {
		t.Error("corte sin avanzar: la pasada nunca salió bien")
	}
}

func TestCorrerConReintentos_ElFrenoNoSeReintenta(t *testing.T) {
	j, m := nuevoJob()
	j.op.MaxAcciones = 0
	m.subir(rutaDe("mal"), 5*time.Hour, "no es JPEG", true)
	esperas := 0
	j.esperar = func(ctx context.Context, d time.Duration) error {
		esperas++
		return nil
	}

	j.correrConReintentos(context.Background())

	if esperas != 0 {
		t.Errorf("esperas = %d, want 0: el freno espera al día siguiente, no reintenta", esperas)
	}
}

func TestCorrerConReintentos_SeDetieneSiTerminaElContexto(t *testing.T) {
	j, m := nuevoJob()
	m.errArchivos = errors.New("multimedia caído")
	intentos := 0
	j.esperar = func(ctx context.Context, d time.Duration) error {
		intentos++
		return context.Canceled
	}

	j.correrConReintentos(context.Background())

	if intentos != 1 {
		t.Errorf("esperas = %d, want 1", intentos)
	}
}

func TestEjecutar_EsperaALaHoraYCorre(t *testing.T) {
	j, m := nuevoJob()
	j.ahora = func() time.Time { return time.Date(2026, 11, 5, 1, 0, 0, 0, time.UTC) }
	var esperas []time.Duration
	j.esperar = func(ctx context.Context, d time.Duration) error {
		esperas = append(esperas, d)
		if len(esperas) == 2 {
			return context.Canceled // termina el ciclo en la segunda espera
		}
		return nil
	}

	j.Ejecutar(context.Background())

	if len(esperas) != 2 || esperas[0] != 2*time.Hour {
		t.Errorf("esperas = %v, want la primera de 2h (de la 1:00 a las 3:00)", esperas)
	}
	if m.purgas != 1 {
		t.Errorf("purgas = %d, want 1: tras esperar debía correr una pasada", m.purgas)
	}
}

func TestPasar_ElCorteInicialNoSeMueveSiLaPrimeraPasadaFalla(t *testing.T) {
	j, m := nuevoJob()
	m.errArchivos = errors.New("multimedia caído")
	m.subir(rutaDe("huerfano"), 25*time.Hour, "", false)

	if err := j.Pasar(context.Background()); err == nil {
		t.Fatal("Pasar() = nil, want error")
	}
	// Una hora después el reintento debe seguir revisando desde el mismo inicio.
	j.ahora = func() time.Time { return ahoraTest.Add(time.Hour) }
	m.errArchivos = nil
	if err := j.Pasar(context.Background()); err != nil {
		t.Fatalf("segunda Pasar() = %v, want nil", err)
	}

	if !slices.Equal(m.cuarentena, []string{rutaDe("huerfano")}) {
		t.Errorf("cuarentena = %v, want el huérfano de hace 25 h", m.cuarentena)
	}
}

func TestPasar_ElFrenoCuentaLaFilaDeCadaArchivoInvalido(t *testing.T) {
	j, m := nuevoJob()
	j.op.MaxAcciones = 10
	for i := 0; i < 6; i++ { // 6 archivos + 6 filas = 12 acciones
		m.subir(rutaDe(fmt.Sprint("mal", i)), 5*time.Hour, "no es JPEG", true)
	}

	if err := j.Pasar(context.Background()); !errors.Is(err, ErrFreno) {
		t.Fatalf("Pasar() = %v, want ErrFreno", err)
	}
	if len(m.cuarentena) != 0 {
		t.Errorf("cuarentena = %v, want nada tocado", m.cuarentena)
	}
}
