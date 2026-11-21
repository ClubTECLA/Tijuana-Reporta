package api

import (
	"errors"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/ClubTECLA/cimalert/multimedia/internal/almacenamiento"
	"github.com/gin-gonic/gin"
)

// overheadMultipartBytes es el margen del multipart sobre el límite del archivo.
const overheadMultipartBytes = 64 << 10

// maxExistenBytes es el máximo del body de POST /existen (1 MiB, unas 20 mil rutas).
const maxExistenBytes = 1 << 20

// Almacen guarda, borra y revisa archivos.
type Almacen interface {
	Guardar(carpeta, extension string, contenido []byte) (string, error)
	Borrar(ruta string) error
	Listar(desde, hasta time.Time, limites almacenamiento.Limites) ([]almacenamiento.Archivo, error)
	Faltan(rutas []string) ([]string, error)
	Cuarentena(ruta string) error
	PurgarCuarentena(antes time.Time) (int, error)
}

// Opciones reúne los límites y dependencias del router.
type Opciones struct {
	MaxArchivoBytes int64
	// MaxFotoBytes y MaxVideoBytes son el tamaño a partir del cual una foto o un
	// video guardado se considera demasiado grande al revisarlo (GET /archivos).
	MaxFotoBytes  int64
	MaxVideoBytes int64
	Almacen       Almacen
}

// NewRouter arma el router del servicio.
func NewRouter(op Opciones) *gin.Engine {
	r := gin.Default()

	r.MaxMultipartMemory = 8 << 20

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	r.POST("/upload", subir(op))
	r.DELETE("/upload/*ruta", borrar(op.Almacen))

	// Rutas del mantenimiento: las llama el backend, igual que /upload.
	r.GET("/archivos", listar(op))
	r.POST("/existen", existen(op.Almacen))
	r.POST("/cuarentena/*ruta", aCuarentena(op.Almacen))
	r.DELETE("/cuarentena", purgarCuarentena(op.Almacen))

	return r
}

// archivoJSON es un archivo guardado tal como lo devuelve GET /archivos.
type archivoJSON struct {
	Path   string `json:"path"`
	Bytes  int64  `json:"bytes"`
	Motivo string `json:"motivo,omitempty"`
}

// listar devuelve los archivos modificados entre los query desde (incluido) y
// hasta (no incluido), con el motivo si incumplen las reglas.
func listar(op Opciones) gin.HandlerFunc {
	return func(c *gin.Context) {
		desde, ok := fechaDeQuery(c, "desde")
		if !ok {
			return
		}
		hasta, ok := fechaDeQuery(c, "hasta")
		if !ok {
			return
		}

		archivos, err := op.Almacen.Listar(desde, hasta, almacenamiento.Limites{FotoBytes: op.MaxFotoBytes, VideoBytes: op.MaxVideoBytes})
		if err != nil {
			c.Error(err)
			responderError(c, http.StatusInternalServerError, "error al revisar los archivos")
			return
		}

		respuesta := make([]archivoJSON, 0, len(archivos))
		for _, a := range archivos {
			respuesta = append(respuesta, archivoJSON{Path: a.Ruta, Bytes: a.Bytes, Motivo: a.Motivo})
		}
		c.JSON(http.StatusOK, gin.H{"archivos": respuesta})
	}
}

// existen recibe {"paths": [...]} y responde {"faltan": [...]} con las rutas
// que no existen como archivo guardado.
func existen(almacen Almacen) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxExistenBytes)

		var body struct {
			Paths []string `json:"paths"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			var excedido *http.MaxBytesError
			if errors.As(err, &excedido) {
				responderError(c, http.StatusRequestEntityTooLarge, "petición demasiado grande")
				return
			}
			responderError(c, http.StatusBadRequest, "cuerpo inválido")
			return
		}

		faltan, err := almacen.Faltan(body.Paths)
		if err != nil {
			c.Error(err)
			responderError(c, http.StatusInternalServerError, "error al consultar los archivos")
			return
		}
		c.JSON(http.StatusOK, gin.H{"faltan": faltan})
	}
}

// aCuarentena aparta un archivo del almacén. Responde 204 aunque ya no exista,
// para que el backend pueda reintentar.
func aCuarentena(almacen Almacen) gin.HandlerFunc {
	return func(c *gin.Context) {
		ruta := strings.TrimPrefix(c.Param("ruta"), "/")

		if err := almacen.Cuarentena(ruta); err != nil {
			if errors.Is(err, almacenamiento.ErrRutaNoPermitida) {
				responderError(c, http.StatusBadRequest, "ruta inválida")
				return
			}
			c.Error(err)
			responderError(c, http.StatusInternalServerError, "error al mover a cuarentena")
			return
		}

		c.Status(http.StatusNoContent)
	}
}

// purgarCuarentena borra de la cuarentena lo que llegó antes del query antes.
func purgarCuarentena(almacen Almacen) gin.HandlerFunc {
	return func(c *gin.Context) {
		antes, ok := fechaDeQuery(c, "antes")
		if !ok {
			return
		}

		borrados, err := almacen.PurgarCuarentena(antes)
		if err != nil {
			c.Error(err)
			responderError(c, http.StatusInternalServerError, "error al vaciar la cuarentena")
			return
		}
		c.JSON(http.StatusOK, gin.H{"borrados": borrados})
	}
}

// fechaDeQuery lee el query nombre como fecha RFC 3339. Si falta o es inválida
// responde 400 y devuelve false.
func fechaDeQuery(c *gin.Context, nombre string) (time.Time, bool) {
	t, err := time.Parse(time.RFC3339Nano, c.Query(nombre))
	if err != nil {
		responderError(c, http.StatusBadRequest, "falta "+nombre+" o no es una fecha RFC 3339")
		return time.Time{}, false
	}
	return t, true
}

// borrar elimina un archivo guardado antes con subir. Responde 204 aunque ya
// no exista, para que el backend pueda reintentar la limpieza.
func borrar(almacen Almacen) gin.HandlerFunc {
	return func(c *gin.Context) {
		ruta := strings.TrimPrefix(c.Param("ruta"), "/")

		if err := almacen.Borrar(ruta); err != nil {
			if errors.Is(err, almacenamiento.ErrRutaInvalida) {
				responderError(c, http.StatusBadRequest, "ruta inválida")
				return
			}
			c.Error(err)
			responderError(c, http.StatusInternalServerError, "error al borrar el archivo")
			return
		}

		c.Status(http.StatusNoContent)
	}
}

// subir guarda tal cual el archivo del campo "file" en la "carpeta" indicada,
// con la "extension" pedida (jpg o mp4). No lo valida ni lo transforma: eso lo
// hace el backend antes de enviarlo.
func subir(op Opciones) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, op.MaxArchivoBytes+overheadMultipartBytes)

		header, err := c.FormFile("file")
		if err != nil {
			var excedido *http.MaxBytesError
			switch {
			case errors.As(err, &excedido):
				responderError(c, http.StatusRequestEntityTooLarge, "archivo demasiado grande")
			case errors.Is(err, http.ErrMissingFile):
				responderError(c, http.StatusBadRequest, "falta el campo file")
			default:
				responderError(c, http.StatusBadRequest, "petición multipart inválida")
			}
			return
		}

		if header.Size > op.MaxArchivoBytes {
			responderError(c, http.StatusRequestEntityTooLarge, "archivo demasiado grande")
			return
		}

		carpeta := c.PostForm("carpeta")
		if carpeta == "" {
			responderError(c, http.StatusBadRequest, "falta el campo carpeta")
			return
		}
		if !almacenamiento.CarpetaValida(carpeta) {
			responderError(c, http.StatusBadRequest, "carpeta inválida")
			return
		}

		extension := c.PostForm("extension")
		if extension != almacenamiento.ExtensionJPG && extension != almacenamiento.ExtensionMP4 {
			responderError(c, http.StatusBadRequest, "extensión inválida")
			return
		}

		archivo, err := header.Open()
		if err != nil {
			c.Error(err)
			responderError(c, http.StatusInternalServerError, "error al leer archivo")
			return
		}
		defer archivo.Close()

		contenido, err := io.ReadAll(archivo)
		if err != nil {
			c.Error(err)
			responderError(c, http.StatusInternalServerError, "error al leer archivo")
			return
		}

		ruta, err := op.Almacen.Guardar(carpeta, extension, contenido)
		if err != nil {
			c.Error(err)
			responderError(c, http.StatusInternalServerError, "error al guardar el archivo")
			return
		}

		c.JSON(http.StatusCreated, gin.H{"path": ruta})
	}
}

// responderError responde con el formato {"message": "..."} del backend.
func responderError(c *gin.Context, status int, mensaje string) {
	c.JSON(status, gin.H{"message": mensaje})
}
