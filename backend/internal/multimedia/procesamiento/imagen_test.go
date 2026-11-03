package procesamiento

import (
	"bytes"
	"errors"
	"image"
	"image/color"
	"image/gif"
	"image/jpeg"
	"image/png"
	"io"
	"testing"
)

// pngDe devuelve un PNG liso de ancho x alto píxeles.
func pngDe(t *testing.T, ancho, alto int) []byte {
	t.Helper()

	var buf bytes.Buffer
	if err := png.Encode(&buf, image.NewRGBA(image.Rect(0, 0, ancho, alto))); err != nil {
		t.Fatalf("png.Encode() = %v, want nil", err)
	}
	return buf.Bytes()
}

// jpegDe devuelve un JPEG liso de ancho x alto píxeles.
func jpegDe(t *testing.T, ancho, alto int) []byte {
	t.Helper()

	var buf bytes.Buffer
	if err := jpeg.Encode(&buf, image.NewRGBA(image.Rect(0, 0, ancho, alto)), nil); err != nil {
		t.Fatalf("jpeg.Encode() = %v, want nil", err)
	}
	return buf.Bytes()
}

// gifDe devuelve un GIF de 1x1 píxel.
func gifDe(t *testing.T) []byte {
	t.Helper()

	var buf bytes.Buffer
	if err := gif.Encode(&buf, image.NewPaletted(image.Rect(0, 0, 1, 1), color.Palette{color.Black}), nil); err != nil {
		t.Fatalf("gif.Encode() = %v, want nil", err)
	}
	return buf.Bytes()
}

func TestValidarImagen(t *testing.T) {
	const maxPixeles = 10_000 // 100x100

	png10 := pngDe(t, 10, 10)
	jpeg10 := jpegDe(t, 10, 10)

	tests := []struct {
		name      string
		contenido []byte
		want      error
	}{
		{name: "jpeg válido", contenido: jpeg10, want: nil},
		{name: "jpeg justo en el máximo de píxeles", contenido: jpegDe(t, 100, 100), want: nil},
		{name: "jpeg un píxel sobre el máximo", contenido: jpegDe(t, 101, 100), want: ErrImagenMuyGrande},
		{name: "png (imagen válida, formato no aceptado)", contenido: png10, want: ErrFormatoNoSoportado},
		{name: "jpeg sobre el máximo de píxeles", contenido: jpegDe(t, 200, 200), want: ErrImagenMuyGrande},
		{name: "texto plano", contenido: []byte("esto no es una imagen"), want: ErrFormatoNoSoportado},
		{name: "archivo vacío", contenido: []byte{}, want: ErrFormatoNoSoportado},
		{name: "gif (imagen válida, formato no aceptado)", contenido: gifDe(t), want: ErrFormatoNoSoportado},
		{name: "jpeg truncado", contenido: jpeg10[:4], want: ErrFormatoNoSoportado},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidarImagen(bytes.NewReader(tt.contenido), maxPixeles)

			if !errors.Is(err, tt.want) {
				t.Errorf("ValidarImagen() = %v, want %v", err, tt.want)
			}
		})
	}
}

// Después de validar, el lector queda al inicio.
func TestValidarImagen_DejaElLectorAlInicio(t *testing.T) {
	contenido := jpegDe(t, 10, 10)
	r := bytes.NewReader(contenido)

	if err := ValidarImagen(r, 10_000); err != nil {
		t.Fatalf("ValidarImagen() = %v, want nil", err)
	}

	got, err := io.ReadAll(r)
	if err != nil {
		t.Fatalf("ReadAll() = %v, want nil", err)
	}
	if !bytes.Equal(got, contenido) {
		t.Errorf("ReadAll() leyó %d bytes, want %d (el archivo completo)", len(got), len(contenido))
	}
}
