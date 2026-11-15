package procesamiento

import (
	"bytes"
	"encoding/binary"
	"errors"
	"fmt"
	"time"
)

// ErrVideoMuyLargo se devuelve cuando el video dura más de lo permitido.
var ErrVideoMuyLargo = errors.New("el video dura más de lo permitido")

// marcaQuickTime es la marca de los .mov. Se rechazan: el iPhone los graba en HEVC.
const marcaQuickTime = "qt  "

// caja es una caja de un MP4: el tipo y dónde empieza y acaba dentro del archivo.
type caja struct {
	tipo   string
	inicio int // primer byte de la cabecera
	cuerpo int // primer byte del contenido
	fin    int // byte siguiente al último
}

func estructura(motivo string) error {
	return fmt.Errorf("%w: %s", ErrFormatoNoSoportado, motivo)
}

// ProcesarVideo comprueba que datos sea un MP4 bien formado de a lo más
// maxDuracion y devuelve una copia sin la ubicación ni otros metadatos. No
// decodifica el video ni revisa sus pistas: lee solo la estructura de cajas.
//
// Los metadatos (cajas udta, meta y uuid, a nivel de archivo, de moov y de cada
// trak) no se quitan sino que se convierten en cajas free del mismo tamaño y con
// el contenido en ceros, así ningún offset del video se mueve.
func ProcesarVideo(datos []byte, maxDuracion time.Duration) ([]byte, error) {
	salida := bytes.Clone(datos)

	var hayFtyp, hayMoov, hayMdat bool
	err := recorrer(salida, 0, len(salida), func(c caja) error {
		if !hayFtyp {
			if c.tipo != "ftyp" {
				return estructura("no empieza con ftyp")
			}
			if c.fin-c.cuerpo < 8 {
				return estructura("ftyp truncada")
			}
			if string(salida[c.cuerpo:c.cuerpo+4]) == marcaQuickTime {
				return estructura("QuickTime (.mov) no se acepta")
			}
			hayFtyp = true
			return nil
		}

		switch c.tipo {
		case "moov":
			if hayMoov {
				return estructura("más de un moov")
			}
			hayMoov = true
			return procesarMoov(salida, c, maxDuracion)
		case "mdat":
			hayMdat = true
		case "udta", "meta", "uuid":
			borrarCaja(salida, c)
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	switch {
	case !hayFtyp:
		return nil, estructura("archivo vacío")
	case !hayMoov:
		return nil, estructura("falta moov")
	case !hayMdat:
		return nil, estructura("falta mdat")
	}
	return salida, nil
}

// procesarMoov revisa la duración y las pistas de moov y borra sus metadatos.
func procesarMoov(b []byte, moov caja, maxDuracion time.Duration) error {
	var hayMvhd, hayTrak bool
	err := recorrer(b, moov.cuerpo, moov.fin, func(c caja) error {
		switch c.tipo {
		case "mvhd":
			if hayMvhd {
				return estructura("más de un mvhd")
			}
			hayMvhd = true
			return revisarDuracion(b, c, maxDuracion)
		case "trak":
			hayTrak = true
			return recorrer(b, c.cuerpo, c.fin, func(h caja) error {
				if esMetadato(h.tipo) {
					borrarCaja(b, h)
				}
				return nil
			})
		}
		if esMetadato(c.tipo) {
			borrarCaja(b, c)
		}
		return nil
	})
	switch {
	case err != nil:
		return err
	case !hayMvhd:
		return estructura("falta mvhd")
	case !hayTrak:
		return estructura("falta trak")
	}
	return nil
}

func esMetadato(tipo string) bool {
	return tipo == "udta" || tipo == "meta" || tipo == "uuid"
}

// revisarDuracion lee la duración de mvhd. Una duración cero (como la de un MP4
// fragmentado) tampoco se acepta, porque no se puede comprobar.
func revisarDuracion(b []byte, mvhd caja, maxDuracion time.Duration) error {
	cuerpo := b[mvhd.cuerpo:mvhd.fin]
	if len(cuerpo) < 1 {
		return estructura("mvhd truncada")
	}

	var escala uint32
	var duracion uint64
	switch cuerpo[0] {
	case 0:
		if len(cuerpo) < 20 {
			return estructura("mvhd truncada")
		}
		escala = binary.BigEndian.Uint32(cuerpo[12:])
		duracion = uint64(binary.BigEndian.Uint32(cuerpo[16:]))
	case 1:
		if len(cuerpo) < 32 {
			return estructura("mvhd truncada")
		}
		escala = binary.BigEndian.Uint32(cuerpo[20:])
		duracion = binary.BigEndian.Uint64(cuerpo[24:])
	default:
		return estructura("versión de mvhd desconocida")
	}
	if escala == 0 || duracion == 0 {
		return estructura("duración no declarada")
	}

	if float64(duracion) > maxDuracion.Seconds()*float64(escala) {
		return ErrVideoMuyLargo
	}
	return nil
}

// recorrer llama a f con cada caja que hay entre desde y hasta. Devuelve error si
// las cajas no encajan exactamente en ese tramo.
func recorrer(b []byte, desde, hasta int, f func(caja) error) error {
	for pos := desde; pos < hasta; {
		c, err := leerCaja(b, pos, hasta)
		if err != nil {
			return err
		}
		if err := f(c); err != nil {
			return err
		}
		pos = c.fin
	}
	return nil
}

// leerCaja lee la cabecera de la caja que empieza en pos y comprueba que quepa
// antes de limite. Un tamaño 0 significa "hasta limite" y un 1, que el tamaño
// real va en 64 bits después del tipo.
func leerCaja(b []byte, pos, limite int) (caja, error) {
	if limite-pos < 8 {
		return caja{}, estructura("caja truncada")
	}
	c := caja{tipo: string(b[pos+4 : pos+8]), inicio: pos, cuerpo: pos + 8}
	tam := uint64(binary.BigEndian.Uint32(b[pos:]))

	switch tam {
	case 0:
		c.fin = limite
		return c, nil
	case 1:
		if limite-pos < 16 {
			return caja{}, estructura("caja truncada")
		}
		tam = binary.BigEndian.Uint64(b[pos+8:])
		c.cuerpo = pos + 16
		if tam < 16 {
			return caja{}, estructura("tamaño de caja inválido")
		}
	default:
		if tam < 8 {
			return caja{}, estructura("tamaño de caja inválido")
		}
	}
	if tam > uint64(limite-pos) {
		return caja{}, estructura("la caja excede su contenedor")
	}
	c.fin = pos + int(tam)
	return c, nil
}

// borrarCaja convierte la caja en una free del mismo tamaño y pone su contenido en ceros.
func borrarCaja(b []byte, c caja) {
	copy(b[c.inicio+4:], "free")
	clear(b[c.cuerpo:c.fin])
}
