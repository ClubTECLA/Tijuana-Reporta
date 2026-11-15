package almacenamiento

import (
	"os"
	"path/filepath"
	"testing"
)

func TestCuarentena_SiFallaLaCopiaNoDejaArchivoParcial(t *testing.T) {
	dir, dirCuarentena := t.TempDir(), filepath.Join(t.TempDir(), "cuarentena")
	a, err := Abrir(dir, dirCuarentena)
	if err != nil {
		t.Fatalf("Abrir() = %v, want nil", err)
	}
	t.Cleanup(func() { a.Cerrar() })

	// Una carpeta se abre bien pero no se puede leer, así que la copia falla
	// después de crear el destino.
	if err := os.MkdirAll(filepath.Join(dir, "reportes", "abc"), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := a.Cuarentena("reportes/abc"); err == nil {
		t.Fatal("Cuarentena() = nil, want error")
	}

	if _, err := os.Stat(filepath.Join(dirCuarentena, "reportes", "abc")); !os.IsNotExist(err) {
		t.Errorf("el archivo parcial sigue en la cuarentena (Stat = %v)", err)
	}
}

func TestAbrir_RechazaDirectoriosQueSeTraslapan(t *testing.T) {
	base := t.TempDir()
	enlace := filepath.Join(t.TempDir(), "enlace")
	if err := os.Symlink(base, enlace); err != nil {
		t.Fatal(err)
	}

	tests := []struct {
		name, uploads, cuarentena string
	}{
		{"el mismo", base, base},
		{"cuarentena dentro de uploads", base, filepath.Join(base, "cuarentena")},
		{"uploads dentro de cuarentena", filepath.Join(base, "uploads"), base},
		{"el mismo con ruta distinta", base, filepath.Join(base, "x", "..")},
		{"el mismo por enlace simbólico", base, enlace},
		{"dentro, por enlace simbólico", base, filepath.Join(enlace, "cuarentena")},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if a, err := Abrir(tt.uploads, tt.cuarentena); err == nil {
				a.Cerrar()
				t.Error("Abrir() = nil, want error")
			}
		})
	}
}

func TestAbrir_AceptaDirectoriosHermanos(t *testing.T) {
	base := t.TempDir()
	// "uploads" y "uploads-viejo" comparten prefijo de texto pero no se traslapan.
	a, err := Abrir(filepath.Join(base, "uploads"), filepath.Join(base, "uploads-viejo"))
	if err != nil {
		t.Fatalf("Abrir() = %v, want nil", err)
	}
	a.Cerrar()
}
