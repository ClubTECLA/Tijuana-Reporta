package api

import (
	"errors"
	"io"
	"net/http"
	"strings"

	"github.com/ClubTECLA/tijuana-reporta/multimedia/internal/almacenamiento"
	"github.com/gin-gonic/gin"
)

// overheadMultipartBytes es el margen del multipart sobre el límite del archivo.
const overheadMultipartBytes = 64 << 10

// Almacen guarda y borra archivos.
type Almacen interface {
	Guardar(carpeta string, contenido []byte) (string, error)
	Borrar(ruta string) error
}

// Opciones reúne los límites y dependencias del router.
type Opciones struct {
	MaxArchivoBytes int64
	Almacen         Almacen
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

	return r
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

// subir guarda tal cual el archivo del campo "file" en la "carpeta" indicada.
// No lo valida ni lo transforma: eso lo hace el backend antes de enviarlo.
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

		ruta, err := op.Almacen.Guardar(carpeta, contenido)
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
