package almacenamiento

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"os"
	"path"
	"regexp"
)

// ErrCarpetaInvalida se devuelve cuando la carpeta pedida no es una ruta relativa segura.
var ErrCarpetaInvalida = errors.New("carpeta inválida")

// ErrRutaInvalida se devuelve cuando la ruta a borrar no tiene la forma de un archivo guardado por Guardar.
var ErrRutaInvalida = errors.New("ruta inválida")

// carpetaValida acepta segmentos de letras, números, guion y guion bajo separados por "/".
var carpetaValida = regexp.MustCompile(`^[a-zA-Z0-9_-]+(/[a-zA-Z0-9_-]+)*$`)

// rutaValida acepta una carpeta válida seguida de un nombre generado por Guardar.
var rutaValida = regexp.MustCompile(`^[a-zA-Z0-9_-]+(/[a-zA-Z0-9_-]+)*/[0-9a-f]{32}\.jpg$`)

// CarpetaValida indica si carpeta es una ruta relativa permitida.
func CarpetaValida(carpeta string) bool {
	return carpetaValida.MatchString(carpeta)
}

// Almacen guarda archivos dentro de un directorio raíz.
type Almacen struct {
	raiz *os.Root
}

// Abrir crea el directorio dir si no existe y devuelve un Almacen sobre él.
func Abrir(dir string) (*Almacen, error) {
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return nil, fmt.Errorf("crear directorio: %w", err)
	}
	raiz, err := os.OpenRoot(dir)
	if err != nil {
		return nil, fmt.Errorf("abrir directorio: %w", err)
	}
	return &Almacen{raiz: raiz}, nil
}

// Cerrar libera el directorio raíz.
func (a *Almacen) Cerrar() error {
	return a.raiz.Close()
}

// Guardar escribe contenido como un JPEG nuevo dentro de carpeta y devuelve su
// ruta relativa, con "/" como separador.
func (a *Almacen) Guardar(carpeta string, contenido []byte) (string, error) {
	if !CarpetaValida(carpeta) {
		return "", ErrCarpetaInvalida
	}

	nombre, err := nombreAleatorio()
	if err != nil {
		return "", err
	}
	ruta := path.Join(carpeta, nombre+".jpg")

	if err := a.raiz.MkdirAll(carpeta, 0o755); err != nil {
		return "", fmt.Errorf("crear carpeta: %w", err)
	}

	f, err := a.raiz.OpenFile(ruta, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0o644)
	if err != nil {
		return "", fmt.Errorf("crear archivo: %w", err)
	}
	if _, err := f.Write(contenido); err != nil {
		f.Close()
		a.raiz.Remove(ruta)
		return "", fmt.Errorf("escribir archivo: %w", err)
	}
	if err := f.Close(); err != nil {
		a.raiz.Remove(ruta)
		return "", fmt.Errorf("cerrar archivo: %w", err)
	}
	return ruta, nil
}

// Borrar elimina el archivo de la ruta devuelta por Guardar. Si ya no existe no
// es un error.
func (a *Almacen) Borrar(ruta string) error {
	if !rutaValida.MatchString(ruta) {
		return ErrRutaInvalida
	}

	if err := a.raiz.Remove(ruta); err != nil && !errors.Is(err, os.ErrNotExist) {
		return fmt.Errorf("borrar archivo: %w", err)
	}
	return nil
}

// nombreAleatorio devuelve 128 bits aleatorios en hexadecimal.
func nombreAleatorio() (string, error) {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "", fmt.Errorf("generar nombre: %w", err)
	}
	return hex.EncodeToString(b), nil
}
