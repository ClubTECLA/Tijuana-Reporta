package almacenamiento

import (
	"bytes"
	"errors"
	"fmt"
	"io"
	"io/fs"
	"path"
	"time"
)

// Motivos por los que un archivo guardado incumple las reglas del almacén.
const (
	MotivoNombreAjeno = "nombre no generado por el servicio"
	MotivoNoEsJPEG    = "no es JPEG"
	MotivoNoEsMP4     = "no es MP4"
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

// Limites son los tamaños a partir de los cuales un archivo guardado se
// considera demasiado grande, según su tipo.
type Limites struct {
	FotoBytes  int64
	VideoBytes int64
}

// firmaMP4 es el tipo de la primera caja de todo MP4.
var firmaMP4 = []byte("ftyp")

// Listar devuelve los archivos modificados entre desde (incluido) y hasta (no
// incluido), con el primer motivo por el que incumplen las reglas, si lo hay. No
// modifica nada.
func (a *Almacen) Listar(desde, hasta time.Time, limites Limites) ([]Archivo, error) {
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

		motivo, err := motivoDeIncumplimiento(sistema, ruta, info.Size(), limites)
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
func motivoDeIncumplimiento(sistema fs.FS, ruta string, tam int64, limites Limites) (string, error) {
	if !rutaValida.MatchString(ruta) {
		return MotivoNombreAjeno, nil
	}

	motivoTipo, maxBytes := MotivoNoEsJPEG, limites.FotoBytes
	esDeSuTipo := empiezaConJPEG
	if path.Ext(ruta) == "."+ExtensionMP4 {
		motivoTipo, maxBytes = MotivoNoEsMP4, limites.VideoBytes
		esDeSuTipo = empiezaConMP4
	}

	ok, err := esDeSuTipo(sistema, ruta)
	if err != nil {
		return "", err
	}
	if !ok {
		return motivoTipo, nil
	}
	if tam > maxBytes {
		return MotivoMuyGrande, nil
	}
	return "", nil
}

// empiezaConJPEG indica si el archivo ruta comienza con la firma de un JPEG.
func empiezaConJPEG(sistema fs.FS, ruta string) (bool, error) {
	cabecera, err := leerCabecera(sistema, ruta, len(firmaJPEG))
	return bytes.Equal(cabecera, firmaJPEG), err
}

// empiezaConMP4 indica si el archivo ruta comienza con una caja "ftyp", como
// todo MP4: cuatro bytes de tamaño y luego el tipo.
func empiezaConMP4(sistema fs.FS, ruta string) (bool, error) {
	cabecera, err := leerCabecera(sistema, ruta, 8)
	return len(cabecera) == 8 && bytes.Equal(cabecera[4:], firmaMP4), err
}

// leerCabecera devuelve los primeros n bytes del archivo ruta, o nada si es
// más corto.
func leerCabecera(sistema fs.FS, ruta string, n int) ([]byte, error) {
	f, err := sistema.Open(ruta)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	cabecera := make([]byte, n)
	if _, err := io.ReadFull(f, cabecera); err != nil {
		if errors.Is(err, io.EOF) || errors.Is(err, io.ErrUnexpectedEOF) {
			return nil, nil
		}
		return nil, err
	}
	return cabecera, nil
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
