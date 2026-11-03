package procesamiento

import (
	"bytes"
	"encoding/binary"
	"fmt"
)

// QuitarMetadatos devuelve el JPEG sin EXIF (ni el GPS), XMP, IPTC,
// comentarios ni los bytes que sobren después del fin de imagen. No toca los
// píxeles ni los decodifica.
func QuitarMetadatos(jpeg []byte) ([]byte, error) {
	if len(jpeg) < 2 || jpeg[0] != 0xFF || jpeg[1] != 0xD8 {
		return nil, fmt.Errorf("%w: no empieza con SOI", ErrFormatoNoSoportado)
	}

	salida := make([]byte, 0, len(jpeg))
	salida = append(salida, 0xFF, 0xD8)

	i := 2
	for i+2 <= len(jpeg) {
		if jpeg[i] != 0xFF {
			return nil, fmt.Errorf("%w: marcador inválido", ErrFormatoNoSoportado)
		}
		if jpeg[i+1] == 0xFF { // relleno antes de un marcador
			i++
			continue
		}
		marcador := jpeg[i+1]

		switch {
		case marcador == 0xD9:
			return append(salida, 0xFF, 0xD9), nil
		case marcador == 0x01 || marcador >= 0xD0 && marcador <= 0xD8: // sin largo
			salida = append(salida, 0xFF, marcador)
			i += 2
			continue
		}

		if i+4 > len(jpeg) {
			return nil, fmt.Errorf("%w: archivo truncado", ErrFormatoNoSoportado)
		}
		largo := int(binary.BigEndian.Uint16(jpeg[i+2:]))
		if largo < 2 || i+2+largo > len(jpeg) {
			return nil, fmt.Errorf("%w: segmento truncado", ErrFormatoNoSoportado)
		}
		segmento := jpeg[i : i+2+largo]
		if conservarSegmento(marcador, segmento[4:]) {
			salida = append(salida, segmento...)
		}
		i += 2 + largo

		if marcador == 0xDA { // los datos de la imagen siguen hasta el próximo marcador
			fin := finDeDatos(jpeg, i)
			if fin < 0 {
				return nil, fmt.Errorf("%w: archivo truncado", ErrFormatoNoSoportado)
			}
			salida = append(salida, jpeg[i:fin]...)
			i = fin
		}
	}
	return nil, fmt.Errorf("%w: falta el fin de imagen", ErrFormatoNoSoportado)
}

// conservarSegmento dice si un segmento hace falta para mostrar la imagen. De
// los de aplicación solo quedan el JFIF, el perfil de color ICC y el Adobe (que
// indica el espacio de color); el resto, y los comentarios, se descartan.
func conservarSegmento(marcador byte, datos []byte) bool {
	switch {
	case marcador == 0xE0:
		return bytes.HasPrefix(datos, []byte("JFIF\x00"))
	case marcador == 0xE2:
		return bytes.HasPrefix(datos, []byte("ICC_PROFILE\x00"))
	case marcador == 0xEE:
		return bytes.HasPrefix(datos, []byte("Adobe"))
	case marcador >= 0xE1 && marcador <= 0xEF, marcador == 0xFE:
		return false
	}
	return true
}

// finDeDatos devuelve dónde acaban los datos comprimidos que empiezan en
// desde: el próximo marcador que no sea un byte rellenado (FF00) ni un reinicio
// (FFD0 a FFD7). Devuelve -1 si el archivo se acaba antes.
func finDeDatos(b []byte, desde int) int {
	for j := desde; j+1 < len(b); j++ {
		if b[j] != 0xFF {
			continue
		}
		if s := b[j+1]; s != 0x00 && s != 0xFF && (s < 0xD0 || s > 0xD7) {
			return j
		}
	}
	return -1
}
