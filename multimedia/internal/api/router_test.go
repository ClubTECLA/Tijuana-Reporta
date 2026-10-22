package api

import (
	"bytes"
	"encoding/json"
	"errors"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/ClubTECLA/tijuana-reporta/multimedia/internal/almacenamiento"
	"github.com/gin-gonic/gin"
)

const (
	// limiteTest es el máximo de bytes por archivo en los tests.
	limiteTest = 1024
)

// almacenFalso guarda en memoria lo que recibe.
type almacenFalso struct {
	carpeta   string
	contenido []byte
	llamadas  int
	err       error

	borrada    string
	borradas   int
	errBorrado error
}

func (a *almacenFalso) Guardar(carpeta string, contenido []byte) (string, error) {
	a.llamadas++
	if a.err != nil {
		return "", a.err
	}
	a.carpeta = carpeta
	a.contenido = contenido
	return carpeta + "/falso.jpg", nil
}

func (a *almacenFalso) Borrar(ruta string) error {
	a.borradas++
	a.borrada = ruta
	return a.errBorrado
}

// nuevoRouterTest arma el router con los límites de los tests y un almacén falso.
func nuevoRouterTest() (*gin.Engine, *almacenFalso) {
	gin.SetMode(gin.TestMode)
	almacen := &almacenFalso{}
	return NewRouter(Opciones{
		MaxArchivoBytes: limiteTest,
		Almacen:         almacen,
	}), almacen
}

// contenidoDe devuelve size bytes cualesquiera: multimedia no mira el contenido.
func contenidoDe(size int) []byte {
	return bytes.Repeat([]byte("x"), size)
}

// campos son los campos de texto del multipart; el archivo va aparte.
type campos map[string]string

// multipartConArchivo arma un body multipart con el archivo en el campo dado.
func multipartConArchivo(t *testing.T, campo string, contenido []byte, texto campos) (*bytes.Buffer, string) {
	t.Helper()

	var buf bytes.Buffer
	w := multipart.NewWriter(&buf)
	for nombre, valor := range texto {
		if err := w.WriteField(nombre, valor); err != nil {
			t.Fatalf("WriteField() = %v, want nil", err)
		}
	}
	fw, err := w.CreateFormFile(campo, "archivo.bin")
	if err != nil {
		t.Fatalf("CreateFormFile() = %v, want nil", err)
	}
	if _, err := fw.Write(contenido); err != nil {
		t.Fatalf("Write() = %v, want nil", err)
	}
	if err := w.Close(); err != nil {
		t.Fatalf("Close() = %v, want nil", err)
	}
	return &buf, w.FormDataContentType()
}

// subirArchivo hace POST /upload con el archivo en el campo "file" y la carpeta "reportes/abc".
func subirArchivo(t *testing.T, r *gin.Engine, contenido []byte) *httptest.ResponseRecorder {
	t.Helper()
	return subirConCampos(t, r, "file", contenido, campos{"carpeta": "reportes/abc"})
}

func subirConCampos(t *testing.T, r *gin.Engine, campo string, contenido []byte, texto campos) *httptest.ResponseRecorder {
	t.Helper()

	body, contentType := multipartConArchivo(t, campo, contenido, texto)
	req := httptest.NewRequest(http.MethodPost, "/upload", body)
	req.Header.Set("Content-Type", contentType)
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)
	return rec
}

func TestHealth_Responde200(t *testing.T) {
	r, _ := nuevoRouterTest()

	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/health", nil))

	if rec.Code != http.StatusOK {
		t.Errorf("GET /health status = %d, want %d", rec.Code, http.StatusOK)
	}
}

func TestSubir_GuardaElArchivoTalCual(t *testing.T) {
	r, almacen := nuevoRouterTest()
	entrada := []byte("bytes que multimedia no interpreta")

	rec := subirArchivo(t, r, entrada)

	if rec.Code != http.StatusCreated {
		t.Fatalf("POST /upload status = %d, want %d (body: %s)", rec.Code, http.StatusCreated, rec.Body.String())
	}
	var got struct {
		Path string `json:"path"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil {
		t.Fatalf("Unmarshal(%s) = %v, want nil", rec.Body.String(), err)
	}
	if got.Path != "reportes/abc/falso.jpg" {
		t.Errorf("path = %q, want %q", got.Path, "reportes/abc/falso.jpg")
	}
	if almacen.carpeta != "reportes/abc" {
		t.Errorf("carpeta guardada = %q, want %q", almacen.carpeta, "reportes/abc")
	}
	if !bytes.Equal(almacen.contenido, entrada) {
		t.Errorf("contenido guardado = %q, want %q (sin transformar)", almacen.contenido, entrada)
	}
}

func TestSubir_Tamano(t *testing.T) {
	tests := []struct {
		name string
		size int
		want int
	}{
		{name: "dentro del límite", size: 500, want: http.StatusCreated},
		{name: "justo en el límite", size: limiteTest, want: http.StatusCreated},
		{name: "un byte sobre el límite", size: limiteTest + 1, want: http.StatusRequestEntityTooLarge},
		{name: "muy sobre el límite", size: limiteTest + overheadMultipartBytes + 1, want: http.StatusRequestEntityTooLarge},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			r, almacen := nuevoRouterTest()

			rec := subirArchivo(t, r, contenidoDe(tt.size))

			if rec.Code != tt.want {
				t.Errorf("POST /upload status = %d, want %d (body: %s)", rec.Code, tt.want, rec.Body.String())
			}
			if tt.want != http.StatusCreated && almacen.llamadas != 0 {
				t.Errorf("Guardar se llamó %d veces, want 0 si se rechaza", almacen.llamadas)
			}
		})
	}
}

func TestSubir_Campos(t *testing.T) {
	tests := []struct {
		name  string
		campo string
		texto campos
		want  int
	}{
		{name: "falta el campo file", campo: "otro", texto: campos{"carpeta": "reportes/abc"}, want: http.StatusBadRequest},
		{name: "falta la carpeta", campo: "file", texto: campos{}, want: http.StatusBadRequest},
		{name: "carpeta vacía", campo: "file", texto: campos{"carpeta": ""}, want: http.StatusBadRequest},
		{name: "carpeta con ..", campo: "file", texto: campos{"carpeta": "../fuera"}, want: http.StatusBadRequest},
		{name: "carpeta absoluta", campo: "file", texto: campos{"carpeta": "/etc"}, want: http.StatusBadRequest},
		{name: "carpeta con espacios", campo: "file", texto: campos{"carpeta": "a b"}, want: http.StatusBadRequest},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			r, almacen := nuevoRouterTest()

			rec := subirConCampos(t, r, tt.campo, contenidoDe(10), tt.texto)

			if rec.Code != tt.want {
				t.Errorf("POST /upload status = %d, want %d (body: %s)", rec.Code, tt.want, rec.Body.String())
			}
			if almacen.llamadas != 0 {
				t.Errorf("Guardar se llamó %d veces, want 0", almacen.llamadas)
			}
		})
	}
}

func TestSubir_BodyNoMultipart(t *testing.T) {
	r, _ := nuevoRouterTest()

	req := httptest.NewRequest(http.MethodPost, "/upload", strings.NewReader("hola"))
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("POST /upload status = %d, want %d", rec.Code, http.StatusBadRequest)
	}
}

// Un fallo del almacén responde 500 sin mostrar el detalle interno al cliente.
func TestSubir_FalloDelAlmacen(t *testing.T) {
	r, almacen := nuevoRouterTest()
	almacen.err = errors.New("disco lleno en /srv/secreto")

	rec := subirArchivo(t, r, contenidoDe(10))

	if rec.Code != http.StatusInternalServerError {
		t.Errorf("POST /upload status = %d, want %d", rec.Code, http.StatusInternalServerError)
	}
	if strings.Contains(rec.Body.String(), "secreto") {
		t.Errorf("la respuesta filtra el error interno: %s", rec.Body.String())
	}
}

// Los errores salen como {"message": "..."}, igual que el backend.
func TestSubir_ErrorTieneFormatoMessage(t *testing.T) {
	r, _ := nuevoRouterTest()

	rec := subirArchivo(t, r, contenidoDe(limiteTest+1))

	var got struct {
		Message string `json:"message"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil {
		t.Fatalf("Unmarshal(%s) = %v, want nil", rec.Body.String(), err)
	}
	if got.Message == "" {
		t.Errorf("message = %q, want un mensaje no vacío", got.Message)
	}
}

func TestBorrar(t *testing.T) {
	const ruta = "reportes/abc/0123456789abcdef0123456789abcdef.jpg"

	tests := []struct {
		name       string
		errBorrado error
		want       int
	}{
		{name: "se borra", errBorrado: nil, want: http.StatusNoContent},
		{name: "ruta inválida", errBorrado: almacenamiento.ErrRutaInvalida, want: http.StatusBadRequest},
		{name: "fallo del almacén", errBorrado: errors.New("disco roto en /srv/secreto"), want: http.StatusInternalServerError},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			r, almacen := nuevoRouterTest()
			almacen.errBorrado = tt.errBorrado

			rec := httptest.NewRecorder()
			r.ServeHTTP(rec, httptest.NewRequest(http.MethodDelete, "/upload/"+ruta, nil))

			if rec.Code != tt.want {
				t.Errorf("DELETE /upload/%s status = %d, want %d", ruta, rec.Code, tt.want)
			}
			if almacen.borrada != ruta {
				t.Errorf("ruta borrada = %q, want %q (sin la barra inicial)", almacen.borrada, ruta)
			}
			if strings.Contains(rec.Body.String(), "secreto") {
				t.Errorf("la respuesta filtra el error interno: %s", rec.Body.String())
			}
		})
	}
}

func TestBorrar_SinRuta(t *testing.T) {
	r, almacen := nuevoRouterTest()

	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, httptest.NewRequest(http.MethodDelete, "/upload", nil))

	if rec.Code == http.StatusNoContent {
		t.Errorf("DELETE /upload sin ruta status = %d, want que no borre", rec.Code)
	}
	if almacen.borradas != 0 {
		t.Errorf("Borrar se llamó %d veces, want 0", almacen.borradas)
	}
}
