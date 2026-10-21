package procesamiento

import (
	"errors"
	"fmt"
	"image"
	_ "image/jpeg" // decodificador de JPEG
	"io"
	"net/http"
)

var (
	// ErrFormatoNoSoportado se devuelve cuando el contenido no es un JPEG válido.
	ErrFormatoNoSoportado = errors.New("formato de imagen no soportado")
	// ErrImagenMuyGrande se devuelve cuando la imagen pasa del máximo de píxeles.
	ErrImagenMuyGrande = errors.New("la imagen excede las dimensiones permitidas")
)

// ValidarImagen comprueba que r sea un JPEG válido y que no pase de
// maxPixeles. Deja r al inicio.
func ValidarImagen(r io.ReadSeeker, maxPixeles int64) error {
	cabecera := make([]byte, 512)
	n, err := io.ReadFull(r, cabecera)
	if err != nil && !errors.Is(err, io.ErrUnexpectedEOF) && !errors.Is(err, io.EOF) {
		return fmt.Errorf("leer cabecera: %w", err)
	}

	if http.DetectContentType(cabecera[:n]) != "image/jpeg" {
		return ErrFormatoNoSoportado
	}

	if _, err := r.Seek(0, io.SeekStart); err != nil {
		return fmt.Errorf("volver al inicio: %w", err)
	}

	cfg, _, err := image.DecodeConfig(r)
	if err != nil {
		return fmt.Errorf("%w: %v", ErrFormatoNoSoportado, err)
	}
	if int64(cfg.Width)*int64(cfg.Height) > maxPixeles {
		return ErrImagenMuyGrande
	}

	if _, err := r.Seek(0, io.SeekStart); err != nil {
		return fmt.Errorf("volver al inicio: %w", err)
	}
	return nil
}
