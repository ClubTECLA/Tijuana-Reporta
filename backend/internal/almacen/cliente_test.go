package almacen

import (
	"bytes"
	"context"
	"errors"
	"io"
	"mime"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

// servidorMultimedia levanta un servidor que se comporta como multimedia con el manejador dado.
func servidorMultimedia(t *testing.T, h http.HandlerFunc) *Cliente {
	t.Helper()

	srv := httptest.NewServer(h)
	t.Cleanup(srv.Close)
	return NewCliente(srv.URL, 5*time.Second)
}

// responder escribe una respuesta JSON con el código dado.
func responder(w http.ResponseWriter, status int, body string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	io.WriteString(w, body)
}

func TestCliente_Subir(t *testing.T) {
	var gotCarpeta, gotArchivo, gotMetodo, gotRuta string
	c := servidorMultimedia(t, func(w http.ResponseWriter, r *http.Request) {
		gotMetodo, gotRuta = r.Method, r.URL.Path

		tipo, params, err := mime.ParseMediaType(r.Header.Get("Content-Type"))
		if err != nil || tipo != "multipart/form-data" {
			t.Errorf("Content-Type = %q, want multipart/form-data", r.Header.Get("Content-Type"))
			return
		}
		mr := multipart.NewReader(r.Body, params["boundary"])
		for {
			parte, err := mr.NextPart()
			if err != nil {
				break
			}
			contenido, _ := io.ReadAll(parte)
			switch parte.FormName() {
			case "carpeta":
				gotCarpeta = string(contenido)
			case "file":
				gotArchivo = string(contenido)
			}
		}
		responder(w, http.StatusCreated, `{"path":"reportes/abc/0123.jpg"}`)
	})

	path, err := c.Subir(context.Background(), "reportes/abc", strings.NewReader("contenido de la foto"))
	if err != nil {
		t.Fatalf("Subir() error = %v, want nil", err)
	}

	if path != "reportes/abc/0123.jpg" {
		t.Errorf("Subir() path = %q, want %q", path, "reportes/abc/0123.jpg")
	}
	if gotMetodo != http.MethodPost || gotRuta != "/upload" {
		t.Errorf("petición = %s %s, want POST /upload", gotMetodo, gotRuta)
	}
	if gotCarpeta != "reportes/abc" {
		t.Errorf("carpeta enviada = %q, want %q", gotCarpeta, "reportes/abc")
	}
	if gotArchivo != "contenido de la foto" {
		t.Errorf("archivo enviado = %q, want %q", gotArchivo, "contenido de la foto")
	}
}

// Un 5xx significa que multimedia no pudo guardar; un 4xx es un fallo nuestro, porque
// el backend ya validó el archivo, y sale como error genérico.
func TestCliente_Subir_TraduceLosErroresDeMultimedia(t *testing.T) {
	tests := []struct {
		name             string
		status           int
		body             string
		wantNoDisponible bool
	}{
		{name: "400 inesperado", status: 400, body: `{"message":"falta el campo carpeta"}`},
		{name: "413 inesperado", status: 413, body: `{"message":"archivo demasiado grande"}`},
		{name: "500 error interno", status: 500, body: `{"message":"error al guardar el archivo"}`, wantNoDisponible: true},
		{name: "502 sin cuerpo JSON", status: 502, body: `<html>bad gateway</html>`, wantNoDisponible: true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			c := servidorMultimedia(t, func(w http.ResponseWriter, r *http.Request) {
				io.Copy(io.Discard, r.Body)
				responder(w, tt.status, tt.body)
			})

			_, err := c.Subir(context.Background(), "reportes/abc", strings.NewReader("foto"))

			if err == nil {
				t.Fatal("Subir() error = nil, want error")
			}
			if got := errors.Is(err, ErrNoDisponible); got != tt.wantNoDisponible {
				t.Errorf("Subir() error = %v, ErrAlmacenNoDisponible = %v, want %v", err, got, tt.wantNoDisponible)
			}
		})
	}
}

func TestCliente_Subir_RespuestaInvalida(t *testing.T) {
	for _, body := range []string{`no es json`, `{}`, `{"path":""}`} {
		t.Run(body, func(t *testing.T) {
			c := servidorMultimedia(t, func(w http.ResponseWriter, r *http.Request) {
				io.Copy(io.Discard, r.Body)
				responder(w, http.StatusCreated, body)
			})

			if _, err := c.Subir(context.Background(), "reportes/abc", strings.NewReader("foto")); err == nil {
				t.Errorf("Subir() con respuesta %q error = nil, want error", body)
			}
		})
	}
}

// Si multimedia responde sin leer el body (413), Subir debe volver con ese error y
// no quedarse enviando un archivo grande.
func TestCliente_Subir_MultimediaRespondeSinLeerElArchivo(t *testing.T) {
	c := servidorMultimedia(t, func(w http.ResponseWriter, r *http.Request) {
		responder(w, http.StatusRequestEntityTooLarge, `{"message":"archivo demasiado grande"}`)
	})
	grande := bytes.NewReader(make([]byte, 20<<20))
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := c.Subir(ctx, "reportes/abc", grande)

	if err == nil || !strings.Contains(err.Error(), "413") {
		t.Errorf("Subir() error = %v, want el error 413 de multimedia", err)
	}
}

type lectorQueFalla struct{}

func (lectorQueFalla) Read([]byte) (int, error) {
	return 0, errors.New("se cortó la subida del cliente")
}

func TestCliente_Subir_FallaLaLecturaDelArchivo(t *testing.T) {
	c := servidorMultimedia(t, func(w http.ResponseWriter, r *http.Request) {
		io.Copy(io.Discard, r.Body)
		responder(w, http.StatusCreated, `{"path":"reportes/abc/x.jpg"}`)
	})
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if _, err := c.Subir(ctx, "reportes/abc", lectorQueFalla{}); err == nil {
		t.Error("Subir() con un archivo que no se puede leer error = nil, want error")
	}
}

func TestCliente_Subir_ContextoCancelado(t *testing.T) {
	desbloquear := make(chan struct{})
	c := servidorMultimedia(t, func(w http.ResponseWriter, r *http.Request) {
		<-desbloquear
	})
	defer close(desbloquear)
	ctx, cancel := context.WithTimeout(context.Background(), 100*time.Millisecond)
	defer cancel()

	inicio := time.Now()
	_, err := c.Subir(ctx, "reportes/abc", strings.NewReader("foto"))

	if err == nil {
		t.Fatal("Subir() error = nil, want error por contexto cancelado")
	}
	if time.Since(inicio) > 3*time.Second {
		t.Errorf("Subir() tardó %v, want que regrese al cancelarse el contexto", time.Since(inicio))
	}
}

func TestCliente_Subir_MultimediaCaido(t *testing.T) {
	srv := httptest.NewServer(http.NotFoundHandler())
	url := srv.URL
	srv.Close()
	c := NewCliente(url, time.Second)

	_, err := c.Subir(context.Background(), "reportes/abc", strings.NewReader("foto"))

	if !errors.Is(err, ErrNoDisponible) {
		t.Errorf("Subir() con multimedia caído error = %v, want %v", err, ErrNoDisponible)
	}
}

func TestNewCliente_QuitaLaBarraFinal(t *testing.T) {
	var gotRuta string
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotRuta = r.URL.Path
		w.WriteHeader(http.StatusNoContent)
	}))
	defer srv.Close()

	c := NewCliente(srv.URL+"/", time.Second)
	if err := c.Borrar(context.Background(), "reportes/abc/x.jpg"); err != nil {
		t.Fatalf("Borrar() error = %v, want nil", err)
	}

	if gotRuta != "/upload/reportes/abc/x.jpg" {
		t.Errorf("ruta pedida = %q, want %q (sin doble barra)", gotRuta, "/upload/reportes/abc/x.jpg")
	}
}

func TestCliente_Borrar(t *testing.T) {
	tests := []struct {
		name    string
		status  int
		wantErr bool
	}{
		{name: "borrado", status: http.StatusNoContent, wantErr: false},
		{name: "ruta inválida", status: http.StatusBadRequest, wantErr: true},
		{name: "error de multimedia", status: http.StatusInternalServerError, wantErr: true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var gotMetodo, gotRuta string
			c := servidorMultimedia(t, func(w http.ResponseWriter, r *http.Request) {
				gotMetodo, gotRuta = r.Method, r.URL.Path
				if tt.status == http.StatusNoContent {
					w.WriteHeader(tt.status)
					return
				}
				responder(w, tt.status, `{"message":"x"}`)
			})

			err := c.Borrar(context.Background(), "reportes/abc/0123.jpg")

			if (err != nil) != tt.wantErr {
				t.Errorf("Borrar() error = %v, wantErr %v", err, tt.wantErr)
			}
			if gotMetodo != http.MethodDelete || gotRuta != "/upload/reportes/abc/0123.jpg" {
				t.Errorf("petición = %s %s, want DELETE /upload/reportes/abc/0123.jpg", gotMetodo, gotRuta)
			}
		})
	}
}
