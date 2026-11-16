package procesamiento

import "bytes"

// Tipo es el tipo de archivo que se acepta; su valor es la extensión con la que se guarda.
type Tipo string

const (
	TipoFoto  Tipo = "jpg"
	TipoVideo Tipo = "mp4"
)

// DetectarTipo dice si datos empiezan como un JPEG o como un MP4, mirando
// los primeros bytes. Es solo la primera puerta: cada tipo se valida a fondo
// después. Cualquier otra cosa devuelve ErrFormatoNoSoportado.
func DetectarTipo(datos []byte) (Tipo, error) {
	switch {
	case bytes.HasPrefix(datos, []byte{0xFF, 0xD8, 0xFF}):
		return TipoFoto, nil
	case len(datos) >= 8 && bytes.Equal(datos[4:8], []byte("ftyp")):
		return TipoVideo, nil
	}
	return "", ErrFormatoNoSoportado
}
