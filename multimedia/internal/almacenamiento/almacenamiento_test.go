package almacenamiento

import (
	"bytes"
	"errors"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// nuevoAlmacen abre un Almacen sobre un directorio temporal y lo cierra al terminar.
func nuevoAlmacen(t *testing.T) (*Almacen, string) {
	t.Helper()

	dir := t.TempDir()
	a, err := Abrir(dir)
	if err != nil {
		t.Fatalf("Abrir() = %v, want nil", err)
	}
	t.Cleanup(func() { a.Cerrar() })
	return a, dir
}

func TestCarpetaValida(t *testing.T) {
	tests := []struct {
		carpeta string
		want    bool
	}{
		{carpeta: "reportes", want: true},
		{carpeta: "reportes/6f1c2d3e-aaaa-bbbb-cccc-1234567890ab", want: true},
		{carpeta: "a_b-c/d", want: true},
		{carpeta: "", want: false},
		{carpeta: ".", want: false},
		{carpeta: "..", want: false},
		{carpeta: "../x", want: false},
		{carpeta: "a/../b", want: false},
		{carpeta: "/abs", want: false},
		{carpeta: "a/", want: false},
		{carpeta: "a//b", want: false},
		{carpeta: "a b", want: false},
		{carpeta: `a\b`, want: false},
		{carpeta: "a\nb", want: false},
		{carpeta: ".oculta", want: false},
		{carpeta: "a\x00b", want: false},
	}

	for _, tt := range tests {
		t.Run(tt.carpeta, func(t *testing.T) {
			if got := CarpetaValida(tt.carpeta); got != tt.want {
				t.Errorf("CarpetaValida(%q) = %v, want %v", tt.carpeta, got, tt.want)
			}
		})
	}
}

func TestGuardar_EscribeElContenido(t *testing.T) {
	a, dir := nuevoAlmacen(t)
	contenido := []byte("contenido de prueba")

	ruta, err := a.Guardar("reportes/abc", contenido)
	if err != nil {
		t.Fatalf("Guardar() = %v, want nil", err)
	}

	if !strings.HasPrefix(ruta, "reportes/abc/") || !strings.HasSuffix(ruta, ".jpg") {
		t.Errorf("Guardar() ruta = %q, want reportes/abc/<nombre>.jpg", ruta)
	}
	got, err := os.ReadFile(filepath.Join(dir, filepath.FromSlash(ruta)))
	if err != nil {
		t.Fatalf("ReadFile() = %v, want nil", err)
	}
	if !bytes.Equal(got, contenido) {
		t.Errorf("contenido guardado = %q, want %q", got, contenido)
	}
}

func TestGuardar_NombresDistintos(t *testing.T) {
	a, _ := nuevoAlmacen(t)

	vistos := map[string]bool{}
	for i := 0; i < 50; i++ {
		ruta, err := a.Guardar("reportes", []byte("x"))
		if err != nil {
			t.Fatalf("Guardar() = %v, want nil", err)
		}
		if vistos[ruta] {
			t.Fatalf("Guardar() repitió la ruta %q", ruta)
		}
		vistos[ruta] = true
	}
}

func TestGuardar_NoUsaNombreDelCliente(t *testing.T) {
	a, _ := nuevoAlmacen(t)

	ruta, err := a.Guardar("reportes", []byte("x"))
	if err != nil {
		t.Fatalf("Guardar() = %v, want nil", err)
	}

	nombre := strings.TrimSuffix(strings.TrimPrefix(ruta, "reportes/"), ".jpg")
	if len(nombre) != 32 {
		t.Errorf("nombre = %q (%d caracteres), want 32 caracteres hexadecimales", nombre, len(nombre))
	}
}

func TestGuardar_CarpetaInvalida(t *testing.T) {
	a, dir := nuevoAlmacen(t)

	for _, carpeta := range []string{"", "..", "../x", "/etc", "a/../b", "a b"} {
		t.Run(carpeta, func(t *testing.T) {
			_, err := a.Guardar(carpeta, []byte("x"))

			if !errors.Is(err, ErrCarpetaInvalida) {
				t.Errorf("Guardar(%q) = %v, want %v", carpeta, err, ErrCarpetaInvalida)
			}
		})
	}

	entradas, err := os.ReadDir(dir)
	if err != nil {
		t.Fatalf("ReadDir() = %v, want nil", err)
	}
	if len(entradas) != 0 {
		t.Errorf("el directorio tiene %d entradas, want 0 (no debe crearse nada)", len(entradas))
	}
}

// Un enlace simbólico dentro del directorio que apunte afuera no debe permitir
// escribir fuera.
func TestGuardar_NoSaleDelDirectorioPorEnlaceSimbolico(t *testing.T) {
	a, dir := nuevoAlmacen(t)
	afuera := t.TempDir()
	if err := os.Symlink(afuera, filepath.Join(dir, "enlace")); err != nil {
		t.Skipf("no se pudo crear el enlace simbólico: %v", err)
	}

	if _, err := a.Guardar("enlace", []byte("x")); err == nil {
		t.Error("Guardar() por un enlace hacia afuera = nil, want error")
	}

	entradas, err := os.ReadDir(afuera)
	if err != nil {
		t.Fatalf("ReadDir() = %v, want nil", err)
	}
	if len(entradas) != 0 {
		t.Errorf("se escribieron %d archivos fuera del directorio, want 0", len(entradas))
	}
}

func TestGuardar_PermisosDelArchivo(t *testing.T) {
	a, dir := nuevoAlmacen(t)

	ruta, err := a.Guardar("reportes", []byte("x"))
	if err != nil {
		t.Fatalf("Guardar() = %v, want nil", err)
	}

	info, err := os.Stat(filepath.Join(dir, filepath.FromSlash(ruta)))
	if err != nil {
		t.Fatalf("Stat() = %v, want nil", err)
	}
	if info.Mode().Perm()&0o004 == 0 {
		t.Errorf("permisos = %v, want legible por otros (nginx lo sirve)", info.Mode().Perm())
	}
}

func TestAbrir_CreaElDirectorio(t *testing.T) {
	dir := filepath.Join(t.TempDir(), "no", "existe", "aun")

	a, err := Abrir(dir)
	if err != nil {
		t.Fatalf("Abrir() = %v, want nil", err)
	}
	defer a.Cerrar()

	if info, err := os.Stat(dir); err != nil || !info.IsDir() {
		t.Errorf("Stat(%q) = %v, %v, want un directorio", dir, info, err)
	}
}

func TestBorrar_EliminaElArchivo(t *testing.T) {
	a, dir := nuevoAlmacen(t)
	ruta, err := a.Guardar("reportes/abc", []byte("x"))
	if err != nil {
		t.Fatalf("Guardar() = %v, want nil", err)
	}

	if err := a.Borrar(ruta); err != nil {
		t.Fatalf("Borrar() = %v, want nil", err)
	}

	if _, err := os.Stat(filepath.Join(dir, filepath.FromSlash(ruta))); !errors.Is(err, os.ErrNotExist) {
		t.Errorf("Stat() = %v, want que el archivo ya no exista", err)
	}
}

func TestBorrar_YaNoExisteNoEsError(t *testing.T) {
	a, _ := nuevoAlmacen(t)
	ruta, err := a.Guardar("reportes/abc", []byte("x"))
	if err != nil {
		t.Fatalf("Guardar() = %v, want nil", err)
	}

	for i := 0; i < 2; i++ {
		if err := a.Borrar(ruta); err != nil {
			t.Errorf("Borrar() intento %d = %v, want nil", i+1, err)
		}
	}
}

func TestBorrar_RutaInvalida(t *testing.T) {
	a, dir := nuevoAlmacen(t)
	if err := os.WriteFile(filepath.Join(dir, "importante.txt"), []byte("no me borres"), 0o644); err != nil {
		t.Fatalf("WriteFile() = %v, want nil", err)
	}
	valido := strings.Repeat("a", 32)

	tests := []string{
		"",
		"importante.txt",
		"../importante.txt",
		"reportes/../importante.txt",
		"/etc/passwd",
		"reportes/abc",
		"reportes/abc/",
		"reportes/abc/otro.txt",
		"reportes/abc/" + valido + ".png",
		"reportes/abc/" + valido + "a.jpg",
		"reportes/abc/" + strings.ToUpper(valido) + ".jpg",
		valido + ".jpg",
	}
	for _, ruta := range tests {
		t.Run(ruta, func(t *testing.T) {
			if err := a.Borrar(ruta); !errors.Is(err, ErrRutaInvalida) {
				t.Errorf("Borrar(%q) = %v, want %v", ruta, err, ErrRutaInvalida)
			}
		})
	}

	if _, err := os.Stat(filepath.Join(dir, "importante.txt")); err != nil {
		t.Errorf("importante.txt desapareció: %v", err)
	}
}

func TestBorrar_NoBorraOtrosArchivos(t *testing.T) {
	a, dir := nuevoAlmacen(t)
	rutaA, _ := a.Guardar("reportes/abc", []byte("a"))
	rutaB, _ := a.Guardar("reportes/abc", []byte("b"))

	if err := a.Borrar(rutaA); err != nil {
		t.Fatalf("Borrar() = %v, want nil", err)
	}

	if _, err := os.Stat(filepath.Join(dir, filepath.FromSlash(rutaB))); err != nil {
		t.Errorf("el otro archivo desapareció: %v", err)
	}
}
