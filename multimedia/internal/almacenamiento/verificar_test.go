package almacenamiento

import (
	"errors"
	"os"
	"path/filepath"
	"testing"
	"time"
)

const (
	nombreValido = "reportes/abc/0123456789abcdef0123456789abcdef.jpg"
	limiteBytes  = 100
	limiteVideo  = 400
)

// jpegMinimo es lo justo para que empiece como un JPEG.
var jpegMinimo = []byte{0xFF, 0xD8, 0xFF, 0xE0, 0x00}

// almacenConCuarentena abre un Almacen y devuelve también sus dos directorios.
func almacenConCuarentena(t *testing.T) (a *Almacen, dir, cuarentena string) {
	t.Helper()

	dir = filepath.Join(t.TempDir(), "uploads")
	cuarentena = filepath.Join(t.TempDir(), "cuarentena")
	a, err := Abrir(dir, cuarentena)
	if err != nil {
		t.Fatalf("Abrir() = %v, want nil", err)
	}
	t.Cleanup(func() { a.Cerrar() })
	return a, dir, cuarentena
}

// escribir crea el archivo ruta dentro de dir con la fecha de modificación dada.
func escribir(t *testing.T, dir, ruta string, contenido []byte, modificado time.Time) {
	t.Helper()

	completa := filepath.Join(dir, filepath.FromSlash(ruta))
	if err := os.MkdirAll(filepath.Dir(completa), 0o755); err != nil {
		t.Fatalf("MkdirAll() = %v, want nil", err)
	}
	if err := os.WriteFile(completa, contenido, 0o644); err != nil {
		t.Fatalf("WriteFile() = %v, want nil", err)
	}
	if err := os.Chtimes(completa, modificado, modificado); err != nil {
		t.Fatalf("Chtimes() = %v, want nil", err)
	}
}

func TestListar_MotivoPorArchivo(t *testing.T) {
	ahora := time.Now()
	desde, hasta := ahora.Add(-time.Hour), ahora.Add(time.Hour)

	tests := []struct {
		name      string
		ruta      string
		contenido []byte
		want      string
	}{
		{name: "JPEG válido", ruta: nombreValido, contenido: jpegMinimo, want: ""},
		{name: "PNG con nombre válido", ruta: nombreValido, contenido: []byte("\x89PNG\r\n\x1a\n"), want: MotivoNoEsJPEG},
		{name: "vacío", ruta: nombreValido, contenido: nil, want: MotivoNoEsJPEG},
		{name: "más grande que el límite", ruta: nombreValido, contenido: append(append([]byte{}, jpegMinimo...), make([]byte, limiteBytes)...), want: MotivoMuyGrande},
		{name: "nombre ajeno", ruta: "reportes/abc/foto.jpg", contenido: jpegMinimo, want: MotivoNombreAjeno},
		{name: "suelto en la raíz", ruta: "foto.jpg", contenido: jpegMinimo, want: MotivoNombreAjeno},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			a, dir, _ := almacenConCuarentena(t)
			escribir(t, dir, tt.ruta, tt.contenido, ahora)

			got, err := a.Listar(desde, hasta, limitesTest)
			if err != nil {
				t.Fatalf("Listar() = %v, want nil", err)
			}
			if len(got) != 1 {
				t.Fatalf("Listar() = %d archivos, want 1", len(got))
			}
			if got[0].Ruta != tt.ruta || got[0].Motivo != tt.want {
				t.Errorf("Listar()[0] = %+v, want ruta %q motivo %q", got[0], tt.ruta, tt.want)
			}
		})
	}
}

func TestListar_RespetaLaVentana(t *testing.T) {
	a, dir, _ := almacenConCuarentena(t)
	desde := time.Now().Add(-2 * time.Hour).Truncate(time.Second)
	hasta := desde.Add(time.Hour)

	nombre := func(c string) string { return "reportes/abc/" + c + "0000000000000000000000000000000.jpg" }
	escribir(t, dir, nombre("1"), jpegMinimo, desde.Add(-time.Second)) // antes
	escribir(t, dir, nombre("2"), jpegMinimo, desde)                   // en el límite inferior: entra
	escribir(t, dir, nombre("3"), jpegMinimo, hasta.Add(-time.Second)) // dentro
	escribir(t, dir, nombre("4"), jpegMinimo, hasta)                   // en el límite superior: no entra

	got, err := a.Listar(desde, hasta, limitesTest)
	if err != nil {
		t.Fatalf("Listar() = %v, want nil", err)
	}
	if len(got) != 2 {
		t.Fatalf("Listar() = %+v, want los archivos 2 y 3", got)
	}
	rutas := map[string]bool{got[0].Ruta: true, got[1].Ruta: true}
	if !rutas[nombre("2")] || !rutas[nombre("3")] {
		t.Errorf("Listar() = %+v, want los archivos 2 y 3", got)
	}
}

func TestListar_VolumenVacio(t *testing.T) {
	a, _, _ := almacenConCuarentena(t)

	got, err := a.Listar(time.Now().Add(-time.Hour), time.Now(), limitesTest)
	if err != nil {
		t.Fatalf("Listar() = %v, want nil", err)
	}
	if len(got) != 0 {
		t.Errorf("Listar() = %+v, want vacío", got)
	}
}

func TestFaltan(t *testing.T) {
	a, dir, _ := almacenConCuarentena(t)
	escribir(t, dir, nombreValido, jpegMinimo, time.Now())
	otra := "reportes/abc/ffffffffffffffffffffffffffffffff.jpg"

	got, err := a.Faltan([]string{nombreValido, otra, "../fuera.jpg", "foto.jpg"})
	if err != nil {
		t.Fatalf("Faltan() = %v, want nil", err)
	}
	want := []string{otra, "../fuera.jpg", "foto.jpg"}
	if len(got) != len(want) {
		t.Fatalf("Faltan() = %v, want %v", got, want)
	}
	for i := range want {
		if got[i] != want[i] {
			t.Errorf("Faltan()[%d] = %q, want %q", i, got[i], want[i])
		}
	}
}

func TestFaltan_SinRutasDevuelveListaVacia(t *testing.T) {
	a, _, _ := almacenConCuarentena(t)

	got, err := a.Faltan(nil)
	if err != nil {
		t.Fatalf("Faltan() = %v, want nil", err)
	}
	if got == nil || len(got) != 0 {
		t.Errorf("Faltan() = %#v, want una lista vacía y no nil", got)
	}
}

func TestCuarentena_MueveElArchivo(t *testing.T) {
	a, dir, cuarentena := almacenConCuarentena(t)
	escribir(t, dir, nombreValido, []byte("contenido"), time.Now())

	if err := a.Cuarentena(nombreValido); err != nil {
		t.Fatalf("Cuarentena() = %v, want nil", err)
	}

	if _, err := os.Stat(filepath.Join(dir, filepath.FromSlash(nombreValido))); !errors.Is(err, os.ErrNotExist) {
		t.Errorf("el archivo original sigue en el almacén: Stat() = %v", err)
	}
	got, err := os.ReadFile(filepath.Join(cuarentena, filepath.FromSlash(nombreValido)))
	if err != nil {
		t.Fatalf("ReadFile(cuarentena) = %v, want nil", err)
	}
	if string(got) != "contenido" {
		t.Errorf("contenido en cuarentena = %q, want %q", got, "contenido")
	}
}

func TestCuarentena_AceptaNombresAjenos(t *testing.T) {
	a, dir, cuarentena := almacenConCuarentena(t)
	escribir(t, dir, "suelto/mi foto.png", []byte("x"), time.Now())

	if err := a.Cuarentena("suelto/mi foto.png"); err != nil {
		t.Fatalf("Cuarentena() = %v, want nil", err)
	}
	if _, err := os.Stat(filepath.Join(cuarentena, "suelto", "mi foto.png")); err != nil {
		t.Errorf("Stat(cuarentena) = %v, want nil", err)
	}
}

func TestCuarentena_NoExisteNoEsError(t *testing.T) {
	a, _, _ := almacenConCuarentena(t)

	if err := a.Cuarentena(nombreValido); err != nil {
		t.Errorf("Cuarentena() = %v, want nil", err)
	}
}

func TestCuarentena_RutaNoPermitida(t *testing.T) {
	a, _, _ := almacenConCuarentena(t)

	for _, ruta := range []string{"", ".", "..", "../x", "a/../b", "/abs", "a/"} {
		t.Run(ruta, func(t *testing.T) {
			if err := a.Cuarentena(ruta); !errors.Is(err, ErrRutaNoPermitida) {
				t.Errorf("Cuarentena(%q) = %v, want ErrRutaNoPermitida", ruta, err)
			}
		})
	}
}

func TestCuarentena_NoPisaLoQueYaEstaEnCuarentena(t *testing.T) {
	a, dir, cuarentena := almacenConCuarentena(t)

	escribir(t, dir, nombreValido, []byte("primero"), time.Now())
	if err := a.Cuarentena(nombreValido); err != nil {
		t.Fatalf("Cuarentena() = %v, want nil", err)
	}
	escribir(t, dir, nombreValido, []byte("segundo"), time.Now())
	if err := a.Cuarentena(nombreValido); err != nil {
		t.Fatalf("Cuarentena() = %v, want nil", err)
	}

	entradas, err := os.ReadDir(filepath.Join(cuarentena, "reportes", "abc"))
	if err != nil {
		t.Fatalf("ReadDir() = %v, want nil", err)
	}
	if len(entradas) != 2 {
		t.Errorf("archivos en cuarentena = %d, want 2 (el primero no se debe pisar)", len(entradas))
	}
	primero, _ := os.ReadFile(filepath.Join(cuarentena, filepath.FromSlash(nombreValido)))
	if string(primero) != "primero" {
		t.Errorf("el primero en cuarentena = %q, want %q", primero, "primero")
	}
}

func TestPurgarCuarentena(t *testing.T) {
	a, _, cuarentena := almacenConCuarentena(t)
	corte := time.Now().Add(-24 * time.Hour)

	viejo := "reportes/viejo/0123456789abcdef0123456789abcdef.jpg"
	nuevo := "reportes/nuevo/0123456789abcdef0123456789abcdef.jpg"
	escribir(t, cuarentena, viejo, []byte("x"), corte.Add(-time.Hour))
	escribir(t, cuarentena, nuevo, []byte("x"), corte.Add(time.Hour))

	n, err := a.PurgarCuarentena(corte)
	if err != nil {
		t.Fatalf("PurgarCuarentena() = %v, want nil", err)
	}
	if n != 1 {
		t.Errorf("PurgarCuarentena() borró %d, want 1", n)
	}
	if _, err := os.Stat(filepath.Join(cuarentena, filepath.FromSlash(viejo))); !errors.Is(err, os.ErrNotExist) {
		t.Errorf("el archivo viejo sigue en cuarentena: Stat() = %v", err)
	}
	if _, err := os.Stat(filepath.Join(cuarentena, "reportes", "viejo")); !errors.Is(err, os.ErrNotExist) {
		t.Errorf("la carpeta vacía sigue en cuarentena: Stat() = %v", err)
	}
	if _, err := os.Stat(filepath.Join(cuarentena, filepath.FromSlash(nuevo))); err != nil {
		t.Errorf("el archivo reciente debía quedarse: Stat() = %v", err)
	}
}

// limitesTest son los límites de tamaño con los que se revisa en los tests.
var limitesTest = Limites{FotoBytes: limiteBytes, VideoBytes: limiteVideo}
