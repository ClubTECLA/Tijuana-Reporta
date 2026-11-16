package almacenamiento

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

const nombreMP4 = "reportes/abc/0123456789abcdef0123456789abcdef.mp4"

// mp4Minimo es lo justo para que empiece como un MP4: tamaño de la caja y "ftyp".
var mp4Minimo = []byte{0x00, 0x00, 0x00, 0x14, 'f', 't', 'y', 'p', 'i', 's', 'o', 'm'}

func TestGuardar_ExtensionesPermitidas(t *testing.T) {
	tests := []struct {
		extension string
		sufijo    string
	}{
		{ExtensionJPG, ".jpg"},
		{ExtensionMP4, ".mp4"},
	}
	for _, tt := range tests {
		t.Run(tt.extension, func(t *testing.T) {
			a, dir := nuevoAlmacen(t)

			ruta, err := a.Guardar("reportes/abc", tt.extension, []byte("x"))
			if err != nil {
				t.Fatalf("Guardar() = %v, want nil", err)
			}
			if !strings.HasSuffix(ruta, tt.sufijo) {
				t.Errorf("Guardar() ruta = %q, want sufijo %q", ruta, tt.sufijo)
			}
			if _, err := os.Stat(filepath.Join(dir, filepath.FromSlash(ruta))); err != nil {
				t.Errorf("el archivo no quedó guardado: %v", err)
			}
		})
	}
}

func TestGuardar_ExtensionInvalida(t *testing.T) {
	for _, extension := range []string{"", "png", "mov", "JPG", ".jpg", "jpg/../x", "mp4 "} {
		t.Run(extension, func(t *testing.T) {
			a, _ := nuevoAlmacen(t)

			_, err := a.Guardar("reportes/abc", extension, []byte("x"))
			if err != ErrExtensionInvalida {
				t.Errorf("Guardar(%q) = %v, want %v", extension, err, ErrExtensionInvalida)
			}
		})
	}
}

func TestBorrar_AceptaMP4(t *testing.T) {
	a, dir := nuevoAlmacen(t)
	ruta, err := a.Guardar("reportes/abc", ExtensionMP4, []byte("x"))
	if err != nil {
		t.Fatalf("Guardar() = %v, want nil", err)
	}

	if err := a.Borrar(ruta); err != nil {
		t.Fatalf("Borrar(%q) = %v, want nil", ruta, err)
	}
	if _, err := os.Stat(filepath.Join(dir, filepath.FromSlash(ruta))); !os.IsNotExist(err) {
		t.Errorf("el archivo sigue ahí: %v", err)
	}
}

func TestFaltan_ReconoceMP4(t *testing.T) {
	a, dir, _ := almacenConCuarentena(t)
	escribir(t, dir, nombreMP4, mp4Minimo, time.Now())
	otro := "reportes/abc/ffffffffffffffffffffffffffffffff.mp4"

	got, err := a.Faltan([]string{nombreMP4, otro})
	if err != nil {
		t.Fatalf("Faltan() = %v, want nil", err)
	}
	if len(got) != 1 || got[0] != otro {
		t.Errorf("Faltan() = %v, want [%q]", got, otro)
	}
}

func TestListar_MotivoDeVideo(t *testing.T) {
	ahora := time.Now()
	desde, hasta := ahora.Add(-time.Hour), ahora.Add(time.Hour)
	relleno := func(base []byte, mas int) []byte { return append(append([]byte{}, base...), make([]byte, mas)...) }

	tests := []struct {
		name      string
		ruta      string
		contenido []byte
		want      string
	}{
		{name: "MP4 válido", ruta: nombreMP4, contenido: mp4Minimo, want: ""},
		{name: "MP4 más grande que el límite de foto pero no que el de video", ruta: nombreMP4, contenido: relleno(mp4Minimo, limiteBytes*2), want: ""},
		{name: "MP4 más grande que el límite de video", ruta: nombreMP4, contenido: relleno(mp4Minimo, limiteVideo), want: MotivoMuyGrande},
		{name: "JPEG con extensión mp4", ruta: nombreMP4, contenido: jpegMinimo, want: MotivoNoEsMP4},
		{name: "MP4 con extensión jpg", ruta: nombreValido, contenido: mp4Minimo, want: MotivoNoEsJPEG},
		{name: "vacío con extensión mp4", ruta: nombreMP4, contenido: nil, want: MotivoNoEsMP4},
		{name: "ftyp en otra posición", ruta: nombreMP4, contenido: []byte{'f', 't', 'y', 'p', 0, 0, 0, 0}, want: MotivoNoEsMP4},
		{name: "extensión no permitida", ruta: "reportes/abc/0123456789abcdef0123456789abcdef.mov", contenido: mp4Minimo, want: MotivoNombreAjeno},
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
