package almacenamiento

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"io/fs"
	"os"
	"path"
	"path/filepath"
	"regexp"
	"strings"
)

// ErrCarpetaInvalida se devuelve cuando la carpeta pedida no es una ruta relativa segura.
var ErrCarpetaInvalida = errors.New("carpeta inválida")

// ErrExtensionInvalida se devuelve cuando la extensión pedida no es una de las permitidas.
var ErrExtensionInvalida = errors.New("extensión inválida")

// Extensiones con las que Guardar acepta guardar un archivo.
const (
	ExtensionJPG = "jpg"
	ExtensionMP4 = "mp4"
)

// ErrRutaInvalida se devuelve cuando la ruta a borrar no tiene la forma de un archivo guardado por Guardar.
var ErrRutaInvalida = errors.New("ruta inválida")

// carpetaValida acepta segmentos de letras, números, guion y guion bajo separados por "/".
var carpetaValida = regexp.MustCompile(`^[a-zA-Z0-9_-]+(/[a-zA-Z0-9_-]+)*$`)

// rutaValida acepta una carpeta válida seguida de un nombre generado por Guardar.
var rutaValida = regexp.MustCompile(`^[a-zA-Z0-9_-]+(/[a-zA-Z0-9_-]+)*/[0-9a-f]{32}\.(jpg|mp4)$`)

// CarpetaValida indica si carpeta es una ruta relativa permitida.
func CarpetaValida(carpeta string) bool {
	return carpetaValida.MatchString(carpeta)
}

// Almacen guarda archivos dentro de un directorio raíz y aparta los sospechosos
// en otro directorio, la cuarentena, que no se sirve al público.
type Almacen struct {
	raiz       *os.Root
	cuarentena *os.Root
}

// Abrir crea los directorios dir y dirCuarentena si no existen y devuelve un
// Almacen sobre ellos.
func Abrir(dir, dirCuarentena string) (*Almacen, error) {
	if err := comprobarSeparados(dir, dirCuarentena); err != nil {
		return nil, err
	}
	raiz, err := abrirRaiz(dir)
	if err != nil {
		return nil, err
	}
	cuarentena, err := abrirRaiz(dirCuarentena)
	if err != nil {
		raiz.Close()
		return nil, err
	}
	return &Almacen{raiz: raiz, cuarentena: cuarentena}, nil
}

// comprobarSeparados devuelve error si los directorios son el mismo o uno está
// dentro del otro: la purga de la cuarentena borraría archivos vivos. Resuelve
// los enlaces simbólicos, aunque los directorios aún no existan.
func comprobarSeparados(dir, dirCuarentena string) error {
	a, err := rutaReal(dir)
	if err != nil {
		return err
	}
	b, err := rutaReal(dirCuarentena)
	if err != nil {
		return err
	}
	if dentroDe(a, b) || dentroDe(b, a) {
		return fmt.Errorf("el directorio de uploads (%s) y el de cuarentena (%s) no pueden ser el mismo ni estar uno dentro del otro", dir, dirCuarentena)
	}
	return nil
}

// dentroDe dice si hijo es padre o está dentro de padre.
func dentroDe(hijo, padre string) bool {
	rel, err := filepath.Rel(padre, hijo)
	return err == nil && rel != ".." && !strings.HasPrefix(rel, ".."+string(filepath.Separator))
}

// rutaReal devuelve la ruta absoluta de dir con los enlaces simbólicos resueltos.
// Si dir no existe, resuelve su carpeta existente más cercana y le agrega el resto.
func rutaReal(dir string) (string, error) {
	abs, err := filepath.Abs(dir)
	if err != nil {
		return "", fmt.Errorf("resolver directorio: %w", err)
	}
	resto := ""
	for actual := abs; ; actual = filepath.Dir(actual) {
		real, err := filepath.EvalSymlinks(actual)
		if err == nil {
			return filepath.Join(real, resto), nil
		}
		if !errors.Is(err, fs.ErrNotExist) || actual == filepath.Dir(actual) {
			return "", fmt.Errorf("resolver directorio: %w", err)
		}
		resto = filepath.Join(filepath.Base(actual), resto)
	}
}

// abrirRaiz crea el directorio dir si no existe y lo abre como raíz.
func abrirRaiz(dir string) (*os.Root, error) {
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return nil, fmt.Errorf("crear directorio: %w", err)
	}
	raiz, err := os.OpenRoot(dir)
	if err != nil {
		return nil, fmt.Errorf("abrir directorio: %w", err)
	}
	return raiz, nil
}

// Cerrar libera los directorios raíz.
func (a *Almacen) Cerrar() error {
	return errors.Join(a.raiz.Close(), a.cuarentena.Close())
}

// Guardar escribe contenido como un archivo nuevo con la extensión dada (jpg o
// mp4) dentro de carpeta y devuelve su ruta relativa, con "/" como separador.
// No mira el contenido: eso lo valida quien lo manda.
func (a *Almacen) Guardar(carpeta, extension string, contenido []byte) (string, error) {
	if extension != ExtensionJPG && extension != ExtensionMP4 {
		return "", ErrExtensionInvalida
	}
	if !CarpetaValida(carpeta) {
		return "", ErrCarpetaInvalida
	}

	nombre, err := nombreAleatorio()
	if err != nil {
		return "", err
	}
	ruta := path.Join(carpeta, nombre+"."+extension)

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
