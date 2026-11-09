package almacen

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"io"
	"mime"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"strconv"
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

func TestCliente_Archivos(t *testing.T) {
	desde := time.Date(2026, 11, 4, 3, 0, 0, 0, time.UTC)
	hasta := desde.Add(24 * time.Hour)
	var gotMetodo, gotRuta, gotDesde, gotHasta string
	c := servidorMultimedia(t, func(w http.ResponseWriter, r *http.Request) {
		gotMetodo, gotRuta = r.Method, r.URL.Path
		gotDesde, gotHasta = r.URL.Query().Get("desde"), r.URL.Query().Get("hasta")
		responder(w, http.StatusOK, `{"archivos":[{"path":"reportes/a/ok.jpg","bytes":10},{"path":"reportes/a/mal.jpg","bytes":20,"motivo":"no es JPEG"}]}`)
	})

	got, err := c.Archivos(context.Background(), desde, hasta)
	if err != nil {
		t.Fatalf("Archivos() error = %v, want nil", err)
	}

	if gotMetodo != http.MethodGet || gotRuta != "/archivos" {
		t.Errorf("petición = %s %s, want GET /archivos", gotMetodo, gotRuta)
	}
	if gotDesde != "2026-11-04T03:00:00Z" || gotHasta != "2026-11-05T03:00:00Z" {
		t.Errorf("ventana = %q a %q, want 2026-11-04T03:00:00Z a 2026-11-05T03:00:00Z", gotDesde, gotHasta)
	}
	if len(got) != 2 || got[0].Motivo != "" || got[1].Motivo != "no es JPEG" || got[1].Path != "reportes/a/mal.jpg" {
		t.Errorf("Archivos() = %+v, want el válido sin motivo y el inválido con motivo", got)
	}
}

func TestCliente_Faltan(t *testing.T) {
	var gotMetodo, gotRuta string
	var gotPaths []string
	c := servidorMultimedia(t, func(w http.ResponseWriter, r *http.Request) {
		gotMetodo, gotRuta = r.Method, r.URL.Path
		var body struct {
			Paths []string `json:"paths"`
		}
		json.NewDecoder(r.Body).Decode(&body)
		gotPaths = body.Paths
		responder(w, http.StatusOK, `{"faltan":["b.jpg"]}`)
	})

	got, err := c.Faltan(context.Background(), []string{"a.jpg", "b.jpg"})
	if err != nil {
		t.Fatalf("Faltan() error = %v, want nil", err)
	}

	if gotMetodo != http.MethodPost || gotRuta != "/existen" {
		t.Errorf("petición = %s %s, want POST /existen", gotMetodo, gotRuta)
	}
	if len(gotPaths) != 2 {
		t.Errorf("rutas enviadas = %v, want 2", gotPaths)
	}
	if len(got) != 1 || got[0] != "b.jpg" {
		t.Errorf("Faltan() = %v, want [b.jpg]", got)
	}
}

func TestCliente_Faltan_SinRutasNoLlamaAMultimedia(t *testing.T) {
	llamadas := 0
	c := servidorMultimedia(t, func(w http.ResponseWriter, r *http.Request) {
		llamadas++
		responder(w, http.StatusOK, `{"faltan":[]}`)
	})

	got, err := c.Faltan(context.Background(), nil)
	if err != nil {
		t.Fatalf("Faltan() error = %v, want nil", err)
	}
	if llamadas != 0 || len(got) != 0 {
		t.Errorf("llamadas = %d, faltan = %v, want 0 y vacío", llamadas, got)
	}
}

func TestCliente_Faltan_PartePeticionesGrandes(t *testing.T) {
	var tamanos []int
	c := servidorMultimedia(t, func(w http.ResponseWriter, r *http.Request) {
		var body struct {
			Paths []string `json:"paths"`
		}
		json.NewDecoder(r.Body).Decode(&body)
		tamanos = append(tamanos, len(body.Paths))
		responder(w, http.StatusOK, `{"faltan":[]}`)
	})
	paths := make([]string, maxRutasPorConsulta+10)
	for i := range paths {
		paths[i] = strconv.Itoa(i) + ".jpg"
	}

	if _, err := c.Faltan(context.Background(), paths); err != nil {
		t.Fatalf("Faltan() error = %v, want nil", err)
	}
	if len(tamanos) != 2 || tamanos[0] != maxRutasPorConsulta || tamanos[1] != 10 {
		t.Errorf("tamaños de las peticiones = %v, want [%d 10]", tamanos, maxRutasPorConsulta)
	}
}

func TestCliente_Cuarentena(t *testing.T) {
	var gotMetodo, gotRuta string
	c := servidorMultimedia(t, func(w http.ResponseWriter, r *http.Request) {
		gotMetodo, gotRuta = r.Method, r.URL.EscapedPath()
		w.WriteHeader(http.StatusNoContent)
	})

	if err := c.Cuarentena(context.Background(), "reportes/abc/mi foto.jpg"); err != nil {
		t.Fatalf("Cuarentena() error = %v, want nil", err)
	}

	if gotMetodo != http.MethodPost || gotRuta != "/cuarentena/reportes/abc/mi%20foto.jpg" {
		t.Errorf("petición = %s %s, want POST /cuarentena/reportes/abc/mi%%20foto.jpg", gotMetodo, gotRuta)
	}
}

func TestCliente_PurgarCuarentena(t *testing.T) {
	antes := time.Date(2026, 10, 20, 3, 0, 0, 0, time.UTC)
	var gotMetodo, gotRuta, gotAntes string
	c := servidorMultimedia(t, func(w http.ResponseWriter, r *http.Request) {
		gotMetodo, gotRuta, gotAntes = r.Method, r.URL.Path, r.URL.Query().Get("antes")
		responder(w, http.StatusOK, `{"borrados":4}`)
	})

	got, err := c.PurgarCuarentena(context.Background(), antes)
	if err != nil {
		t.Fatalf("PurgarCuarentena() error = %v, want nil", err)
	}

	if gotMetodo != http.MethodDelete || gotRuta != "/cuarentena" || gotAntes != "2026-10-20T03:00:00Z" {
		t.Errorf("petición = %s %s antes=%q, want DELETE /cuarentena antes=2026-10-20T03:00:00Z", gotMetodo, gotRuta, gotAntes)
	}
	if got != 4 {
		t.Errorf("PurgarCuarentena() = %d, want 4", got)
	}
}

func TestCliente_Revision_TraduceLosErrores(t *testing.T) {
	c := servidorMultimedia(t, func(w http.ResponseWriter, r *http.Request) {
		responder(w, http.StatusInternalServerError, `{"message":"disco roto"}`)
	})
	ctx := context.Background()

	if _, err := c.Archivos(ctx, time.Now(), time.Now()); !errors.Is(err, ErrNoDisponible) {
		t.Errorf("Archivos() error = %v, want ErrNoDisponible", err)
	}
	if _, err := c.Faltan(ctx, []string{"a.jpg"}); !errors.Is(err, ErrNoDisponible) {
		t.Errorf("Faltan() error = %v, want ErrNoDisponible", err)
	}
	if err := c.Cuarentena(ctx, "a.jpg"); !errors.Is(err, ErrNoDisponible) {
		t.Errorf("Cuarentena() error = %v, want ErrNoDisponible", err)
	}
	if _, err := c.PurgarCuarentena(ctx, time.Now()); !errors.Is(err, ErrNoDisponible) {
		t.Errorf("PurgarCuarentena() error = %v, want ErrNoDisponible", err)
	}
}
