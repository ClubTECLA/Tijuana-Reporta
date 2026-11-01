// Package almacen es el cliente del servicio multimedia, que solo guarda y borra
// archivos (ver multimedia/README.md).
package almacen

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"strings"
	"time"
)

// ErrNoDisponible indica que el servicio multimedia no respondió o falló al
// guardar o borrar un archivo.
var ErrNoDisponible = errors.New("el almacenamiento de archivos no está disponible")

// Cliente llama al servicio multimedia por HTTP.
type Cliente struct {
	baseURL string
	http    *http.Client
}

// NewCliente crea un cliente del servicio multimedia en baseURL. timeout cubre la
// petición completa, incluida la subida del archivo.
func NewCliente(baseURL string, timeout time.Duration) *Cliente {
	return &Cliente{
		baseURL: strings.TrimRight(baseURL, "/"),
		http:    &http.Client{Timeout: timeout},
	}
}

type respuestaSubida struct {
	Path string `json:"path"`
}

type respuestaError struct {
	Message string `json:"message"`
}

// Subir envía archivo (ya procesado) a multimedia para que lo guarde en carpeta, y
// devuelve la ruta con la que quedó guardado. El archivo se manda mientras se
// lee, sin cargarlo completo en memoria.
func (c *Cliente) Subir(ctx context.Context, carpeta string, archivo io.Reader) (string, error) {
	pr, pw := io.Pipe()
	defer pr.Close()

	cuerpo := multipart.NewWriter(pw)
	go func() {
		pw.CloseWithError(escribirMultipart(cuerpo, carpeta, archivo))
	}()

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/upload", pr)
	if err != nil {
		return "", fmt.Errorf("armar petición a multimedia: %w", err)
	}
	req.Header.Set("Content-Type", cuerpo.FormDataContentType())

	resp, err := c.http.Do(req)
	if err != nil {
		return "", errorDeConexion(err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated {
		return "", errorDeRespuesta(resp)
	}

	var subida respuestaSubida
	if err := json.NewDecoder(resp.Body).Decode(&subida); err != nil || subida.Path == "" {
		return "", fmt.Errorf("respuesta inválida de multimedia: %v", err)
	}
	return subida.Path, nil
}

// escribirMultipart arma el body de POST /upload: el campo carpeta y el archivo.
func escribirMultipart(cuerpo *multipart.Writer, carpeta string, archivo io.Reader) error {
	if err := cuerpo.WriteField("carpeta", carpeta); err != nil {
		return err
	}
	parte, err := cuerpo.CreateFormFile("file", "archivo")
	if err != nil {
		return err
	}
	if _, err := io.Copy(parte, archivo); err != nil {
		return err
	}
	return cuerpo.Close()
}

// Borrar elimina de multimedia un archivo guardado antes con Subir. Si ya no existe
// no es un error.
func (c *Cliente) Borrar(ctx context.Context, path string) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodDelete, c.baseURL+"/upload/"+path, nil)
	if err != nil {
		return fmt.Errorf("armar petición a multimedia: %w", err)
	}

	resp, err := c.http.Do(req)
	if err != nil {
		return errorDeConexion(err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusNoContent {
		return errorDeRespuesta(resp)
	}
	return nil
}

// errorDeConexion convierte un fallo al llegar a multimedia en ErrAlmacenNoDisponible.
func errorDeConexion(err error) error {
	return fmt.Errorf("%w: llamar a multimedia: %v", ErrNoDisponible, err)
}

// errorDeRespuesta traduce un código de error de multimedia a un error. El backend ya
// validó el archivo, así que un 4xx es un fallo nuestro y se devuelve como error
// genérico (500); un 5xx significa que multimedia no pudo guardar.
func errorDeRespuesta(resp *http.Response) error {
	var e respuestaError
	json.NewDecoder(io.LimitReader(resp.Body, 4<<10)).Decode(&e)

	if resp.StatusCode >= http.StatusInternalServerError {
		return fmt.Errorf("%w: multimedia respondió %d: %s", ErrNoDisponible, resp.StatusCode, e.Message)
	}
	return fmt.Errorf("multimedia respondió %d: %s", resp.StatusCode, e.Message)
}
