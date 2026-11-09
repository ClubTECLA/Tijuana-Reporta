package almacenamiento

import (
	"bytes"
	"errors"
	"fmt"
	"io"
	"io/fs"
	"time"
)

// Motivos por los que un archivo guardado incumple las reglas del almacén.
const (
	MotivoNombreAjeno = "nombre no generado por el servicio"
	MotivoNoEsJPEG    = "no es JPEG"
	MotivoMuyGrande   = "excede el tamaño máximo"
)

// Archivo es un archivo guardado. Motivo queda vacío si cumple las reglas.
type Archivo struct {
	Ruta   string
	Bytes  int64
	Motivo string
}

// firmaJPEG son los primeros bytes de todo JPEG.
var firmaJPEG = []byte{0xFF, 0xD8, 0xFF}

// Listar devuelve los archivos modificados entre desde (incluido) y hasta (no
// incluido), con el primer motivo por el que incumplen las reglas, si lo hay. No
// modifica nada.
func (a *Almacen) Listar(desde, hasta time.Time, maxBytes int64) ([]Archivo, error) {
	var archivos []Archivo

	sistema := a.raiz.FS()
	err := fs.WalkDir(sistema, ".", func(ruta string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if !d.Type().IsRegular() {
			return nil
		}
		info, err := d.Info()
		if err != nil {
			return err
		}
		if info.ModTime().Before(desde) || !info.ModTime().Before(hasta) {
			return nil
		}

		motivo, err := motivoDeIncumplimiento(sistema, ruta, info.Size(), maxBytes)
		if err != nil {
			return err
		}
		archivos = append(archivos, Archivo{Ruta: ruta, Bytes: info.Size(), Motivo: motivo})
		return nil
	})
	if err != nil {
		return nil, fmt.Errorf("recorrer almacén: %w", err)
	}
	return archivos, nil
}

// motivoDeIncumplimiento devuelve por qué el archivo ruta es inválido, o "" si cumple.
func motivoDeIncumplimiento(sistema fs.FS, ruta string, tam, maxBytes int64) (string, error) {
	if !rutaValida.MatchString(ruta) {
		return MotivoNombreAjeno, nil
	}
	esJPEG, err := empiezaConJPEG(sistema, ruta)
	if err != nil {
		return "", err
	}
	if !esJPEG {
		return MotivoNoEsJPEG, nil
	}
	if tam > maxBytes {
		return MotivoMuyGrande, nil
	}
	return "", nil
}

// empiezaConJPEG indica si el archivo ruta comienza con la firma de un JPEG.
func empiezaConJPEG(sistema fs.FS, ruta string) (bool, error) {
	f, err := sistema.Open(ruta)
	if err != nil {
		return false, err
	}
	defer f.Close()

	cabecera := make([]byte, len(firmaJPEG))
	if _, err := io.ReadFull(f, cabecera); err != nil {
		if errors.Is(err, io.EOF) || errors.Is(err, io.ErrUnexpectedEOF) {
			return false, nil
		}
		return false, err
	}
	return bytes.Equal(cabecera, firmaJPEG), nil
}

// Faltan devuelve las rutas de rutas que no existen como archivo guardado.
// Una ruta que no tiene la forma de un archivo guardado cuenta como faltante.
func (a *Almacen) Faltan(rutas []string) ([]string, error) {
	faltan := []string{}
	for _, ruta := range rutas {
		if !rutaValida.MatchString(ruta) {
			faltan = append(faltan, ruta)
			continue
		}
		if _, err := a.raiz.Stat(ruta); err != nil {
			if !errors.Is(err, fs.ErrNotExist) {
				return nil, fmt.Errorf("consultar archivo: %w", err)
			}
			faltan = append(faltan, ruta)
		}
	}
	return faltan, nil
}
