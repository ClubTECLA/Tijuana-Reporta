package almacenamiento

import (
	"errors"
	"fmt"
	"io"
	"io/fs"
	"os"
	"path"
	"strconv"
	"time"
)

// ErrRutaNoPermitida se devuelve cuando la ruta a poner en cuarentena no es una
// ruta relativa limpia.
var ErrRutaNoPermitida = errors.New("ruta no permitida")

// Cuarentena mueve el archivo ruta del almacén a la cuarentena, conservando su
// ruta. Acepta cualquier nombre, no solo los generados por Guardar, porque sirve
// justo para apartar archivos ajenos. Si ya no existe no es un error.
func (a *Almacen) Cuarentena(ruta string) error {
	if !fs.ValidPath(ruta) || ruta == "." {
		return ErrRutaNoPermitida
	}

	origen, err := a.raiz.Open(ruta)
	if err != nil {
		if errors.Is(err, fs.ErrNotExist) {
			return nil
		}
		return fmt.Errorf("abrir archivo: %w", err)
	}
	defer origen.Close()

	if carpeta := path.Dir(ruta); carpeta != "." {
		if err := a.cuarentena.MkdirAll(carpeta, 0o755); err != nil {
			return fmt.Errorf("crear carpeta de cuarentena: %w", err)
		}
	}

	destino, rutaDestino, err := a.crearEnCuarentena(ruta)
	if err != nil {
		return err
	}
	if _, err := io.Copy(destino, origen); err != nil {
		destino.Close()
		a.cuarentena.Remove(rutaDestino)
		return fmt.Errorf("copiar a cuarentena: %w", err)
	}
	if err := destino.Close(); err != nil {
		a.cuarentena.Remove(rutaDestino)
		return fmt.Errorf("cerrar archivo de cuarentena: %w", err)
	}

	if err := a.raiz.Remove(ruta); err != nil && !errors.Is(err, fs.ErrNotExist) {
		return fmt.Errorf("quitar archivo original: %w", err)
	}
	return nil
}

// crearEnCuarentena crea el archivo de destino sin pisar uno que ya esté ahí:
// si la ruta existe, le agrega un sufijo con la hora. Devuelve también la ruta
// relativa a la cuarentena que quedó, porque File.Name trae la de la raíz y no
// sirve para borrarlo con Root.Remove.
func (a *Almacen) crearEnCuarentena(ruta string) (*os.File, string, error) {
	destino := ruta
	for intento := 0; intento < 3; intento++ {
		f, err := a.cuarentena.OpenFile(destino, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0o600)
		if err == nil {
			return f, destino, nil
		}
		if !errors.Is(err, fs.ErrExist) {
			return nil, "", fmt.Errorf("crear archivo de cuarentena: %w", err)
		}
		destino = ruta + "." + strconv.FormatInt(time.Now().UnixNano(), 36)
	}
	return nil, "", errors.New("crear archivo de cuarentena: nombre ocupado")
}

// PurgarCuarentena borra de la cuarentena los archivos que llevan en ella desde
// antes de antes, y devuelve cuántos borró. La antigüedad es la fecha en que
// llegaron a la cuarentena.
func (a *Almacen) PurgarCuarentena(antes time.Time) (int, error) {
	sistema := a.cuarentena.FS()
	var viejos []string

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
		if info.ModTime().Before(antes) {
			viejos = append(viejos, ruta)
		}
		return nil
	})
	if err != nil {
		return 0, fmt.Errorf("recorrer cuarentena: %w", err)
	}

	borrados := 0
	for _, ruta := range viejos {
		if err := a.cuarentena.Remove(ruta); err != nil && !errors.Is(err, fs.ErrNotExist) {
			return borrados, fmt.Errorf("borrar de cuarentena: %w", err)
		}
		borrados++
		// Quita la carpeta del reporte si quedó vacía; si no, Remove falla y no importa.
		if carpeta := path.Dir(ruta); carpeta != "." {
			a.cuarentena.Remove(carpeta)
		}
	}
	return borrados, nil
}
