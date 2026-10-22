package procesamiento

import (
	"bytes"
	"errors"
	"image"
	"image/jpeg"
	"math/rand"
	"testing"
)

// jpegRuidoso devuelve un JPEG con ruido, que lleva bytes FF rellenados (FF00)
// entre los datos comprimidos.
func jpegRuidoso(t *testing.T) []byte {
	t.Helper()

	img := image.NewRGBA(image.Rect(0, 0, 64, 64))
	rand.New(rand.NewSource(1)).Read(img.Pix)
	var buf bytes.Buffer
	if err := jpeg.Encode(&buf, img, nil); err != nil {
		t.Fatalf("jpeg.Encode() = %v, want nil", err)
	}
	return buf.Bytes()
}

// segmento arma un segmento con marcador y datos.
func segmento(marcador byte, datos string) []byte {
	largo := len(datos) + 2
	return append([]byte{0xFF, marcador, byte(largo >> 8), byte(largo)}, datos...)
}

// conSegmentos inserta los segmentos justo después del SOI.
func conSegmentos(jpeg []byte, segmentos ...[]byte) []byte {
	salida := append([]byte{}, jpeg[:2]...)
	for _, s := range segmentos {
		salida = append(salida, s...)
	}
	return append(salida, jpeg[2:]...)
}

func TestQuitarMetadatos(t *testing.T) {
	original := jpegRuidoso(t)
	exif := segmento(0xE1, "Exif\x00\x00GPS-DEL-DOMICILIO")
	xmp := segmento(0xE1, "http://ns.adobe.com/xap/1.0/\x00<x:xmpmeta/>")
	iptc := segmento(0xED, "Photoshop 3.0\x00autor")
	mpf := segmento(0xE2, "MPF\x00segunda-imagen")
	comentario := segmento(0xFE, "comentario")
	icc := segmento(0xE2, "ICC_PROFILE\x00perfil")

	sucio := conSegmentos(original, exif, xmp, iptc, mpf, comentario, icc)
	sucio = append(sucio, []byte("BASURA-DESPUES-DEL-EOI")...)

	limpio, err := QuitarMetadatos(sucio)
	if err != nil {
		t.Fatalf("QuitarMetadatos() error = %v, want nil", err)
	}

	for _, quitado := range []string{"GPS-DEL-DOMICILIO", "xmpmeta", "autor", "segunda-imagen", "comentario", "BASURA"} {
		if bytes.Contains(limpio, []byte(quitado)) {
			t.Errorf("el resultado todavía contiene %q", quitado)
		}
	}
	if !bytes.Contains(limpio, icc) {
		t.Error("el resultado perdió el perfil de color ICC")
	}
	if !bytes.HasSuffix(limpio, []byte{0xFF, 0xD9}) {
		t.Error("el resultado no termina en el fin de imagen")
	}

	// Los píxeles quedan igual.
	antes, err := jpeg.Decode(bytes.NewReader(original))
	if err != nil {
		t.Fatalf("jpeg.Decode(original) = %v", err)
	}
	despues, err := jpeg.Decode(bytes.NewReader(limpio))
	if err != nil {
		t.Fatalf("jpeg.Decode(limpio) = %v, want un JPEG válido", err)
	}
	if !bytes.Equal(antes.(*image.YCbCr).Y, despues.(*image.YCbCr).Y) {
		t.Error("los píxeles cambiaron")
	}
}

// Un JPEG sin metadatos queda tal cual.
func TestQuitarMetadatos_SinMetadatosNoCambia(t *testing.T) {
	original := jpegRuidoso(t)

	limpio, err := QuitarMetadatos(original)
	if err != nil {
		t.Fatalf("QuitarMetadatos() error = %v, want nil", err)
	}
	if !bytes.Equal(limpio, original) {
		t.Errorf("el resultado pesa %d bytes y el original %d, want iguales", len(limpio), len(original))
	}
}

func TestQuitarMetadatos_Invalido(t *testing.T) {
	original := jpegRuidoso(t)

	tests := []struct {
		name      string
		contenido []byte
	}{
		{name: "vacío", contenido: nil},
		{name: "texto plano", contenido: []byte("esto no es una imagen")},
		{name: "sin fin de imagen", contenido: original[:len(original)-2]},
		{name: "cortado en los datos", contenido: original[:len(original)/2]},
		{name: "cortado en un segmento", contenido: original[:10]},
		{name: "largo de segmento falso", contenido: append([]byte{0xFF, 0xD8, 0xFF, 0xE1, 0xFF, 0xFF}, 'x')},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if _, err := QuitarMetadatos(tt.contenido); !errors.Is(err, ErrFormatoNoSoportado) {
				t.Errorf("QuitarMetadatos() error = %v, want %v", err, ErrFormatoNoSoportado)
			}
		})
	}
}
