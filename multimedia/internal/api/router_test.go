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
	"time"

	"github.com/ClubTECLA/cimalert/multimedia/internal/almacenamiento"
	"github.com/gin-gonic/gin"
)

const (
	// limiteTest es el máximo de bytes por archivo en los tests.
	limiteTest = 1024
	// limiteFoto es el tamaño a partir del cual un archivo es demasiado grande al revisarlo.
	limiteFoto = 512
	// limiteVideo es lo mismo para un video.
	limiteVideo = 768
)

// almacenFalso guarda en memoria lo que recibe.
type almacenFalso struct {
	carpeta   string
	extension string
	contenido []byte
	llamadas  int
	err       error

	borrada    string
	borradas   int
	errBorrado error

	archivos      []almacenamiento.Archivo
	desde, hasta  time.Time
	limites       almacenamiento.Limites
	faltan        []string
	consultadas   []string
	cuarentena    string
	errCuarentena error
	purgadoAntes  time.Time
	purgados      int
	errListar     error
}

func (a *almacenFalso) Guardar(carpeta, extension string, contenido []byte) (string, error) {
	a.llamadas++
	if a.err != nil {
		return "", a.err
	}
	a.carpeta = carpeta
	a.extension = extension
	a.contenido = contenido
	return carpeta + "/falso." + extension, nil
}

func (a *almacenFalso) Borrar(ruta string) error {
	a.borradas++
	a.borrada = ruta
	return a.errBorrado
}

func (a *almacenFalso) Listar(desde, hasta time.Time, limites almacenamiento.Limites) ([]almacenamiento.Archivo, error) {
	a.desde, a.hasta, a.limites = desde, hasta, limites
	return a.archivos, a.errListar
}

func (a *almacenFalso) Faltan(rutas []string) ([]string, error) {
	a.consultadas = rutas
	return a.faltan, nil
}

func (a *almacenFalso) Cuarentena(ruta string) error {
	a.cuarentena = ruta
	return a.errCuarentena
}

func (a *almacenFalso) PurgarCuarentena(antes time.Time) (int, error) {
	a.purgadoAntes = antes
	return a.purgados, nil
}

// nuevoRouterTest arma el router con los límites de los tests y un almacén falso.
func nuevoRouterTest() (*gin.Engine, *almacenFalso) {
	gin.SetMode(gin.TestMode)
	almacen := &almacenFalso{}
	return NewRouter(Opciones{
		MaxArchivoBytes: limiteTest,
		MaxFotoBytes:    limiteFoto,
		MaxVideoBytes:   limiteVideo,
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
	return subirConCampos(t, r, "file", contenido, campos{"carpeta": "reportes/abc", "extension": "jpg"})
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
		{name: "falta el campo file", campo: "otro", texto: campos{"carpeta": "reportes/abc", "extension": "jpg"}, want: http.StatusBadRequest},
		{name: "falta la carpeta", campo: "file", texto: campos{"extension": "jpg"}, want: http.StatusBadRequest},
		{name: "carpeta vacía", campo: "file", texto: campos{"carpeta": "", "extension": "jpg"}, want: http.StatusBadRequest},
		{name: "carpeta con ..", campo: "file", texto: campos{"carpeta": "../fuera", "extension": "jpg"}, want: http.StatusBadRequest},
		{name: "carpeta absoluta", campo: "file", texto: campos{"carpeta": "/etc", "extension": "jpg"}, want: http.StatusBadRequest},
		{name: "carpeta con espacios", campo: "file", texto: campos{"carpeta": "a b", "extension": "jpg"}, want: http.StatusBadRequest},
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

func TestSubir_Extension(t *testing.T) {
	validas := []struct{ extension, path string }{
		{"jpg", "reportes/abc/falso.jpg"},
		{"mp4", "reportes/abc/falso.mp4"},
	}
	for _, tt := range validas {
		t.Run(tt.extension, func(t *testing.T) {
			r, almacen := nuevoRouterTest()

			rec := subirConCampos(t, r, "file", contenidoDe(10), campos{"carpeta": "reportes/abc", "extension": tt.extension})

			if rec.Code != http.StatusCreated {
				t.Fatalf("POST /upload status = %d, want %d (body: %s)", rec.Code, http.StatusCreated, rec.Body.String())
			}
			if almacen.extension != tt.extension {
				t.Errorf("extensión guardada = %q, want %q", almacen.extension, tt.extension)
			}
			if !strings.Contains(rec.Body.String(), tt.path) {
				t.Errorf("body = %s, want el path %q", rec.Body.String(), tt.path)
			}
		})
	}

	for _, extension := range []string{"", "png", "mov", "JPG", ".mp4", "mp4 "} {
		t.Run("rechaza "+extension, func(t *testing.T) {
			r, almacen := nuevoRouterTest()

			rec := subirConCampos(t, r, "file", contenidoDe(10), campos{"carpeta": "reportes/abc", "extension": extension})

			if rec.Code != http.StatusBadRequest {
				t.Errorf("POST /upload status = %d, want %d (body: %s)", rec.Code, http.StatusBadRequest, rec.Body.String())
			}
			if almacen.llamadas != 0 {
				t.Errorf("Guardar se llamó %d veces, want 0", almacen.llamadas)
			}
		})
	}

	t.Run("falta el campo", func(t *testing.T) {
		r, almacen := nuevoRouterTest()

		rec := subirConCampos(t, r, "file", contenidoDe(10), campos{"carpeta": "reportes/abc"})

		if rec.Code != http.StatusBadRequest || almacen.llamadas != 0 {
			t.Errorf("POST /upload status = %d con %d llamadas, want %d y 0", rec.Code, almacen.llamadas, http.StatusBadRequest)
		}
	})
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

func TestListar_PasaLaVentanaYDevuelveLosArchivos(t *testing.T) {
	r, almacen := nuevoRouterTest()
	almacen.archivos = []almacenamiento.Archivo{
		{Ruta: "reportes/a/ok.jpg", Bytes: 10},
		{Ruta: "reportes/a/mal.jpg", Bytes: 20, Motivo: almacenamiento.MotivoNoEsJPEG},
	}
	desde := time.Date(2026, 11, 4, 3, 0, 0, 0, time.UTC)
	hasta := desde.Add(24 * time.Hour)

	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, httptest.NewRequest(http.MethodGet,
		"/archivos?desde="+desde.Format(time.RFC3339)+"&hasta="+hasta.Format(time.RFC3339), nil))

	if rec.Code != http.StatusOK {
		t.Fatalf("GET /archivos status = %d, want %d (body: %s)", rec.Code, http.StatusOK, rec.Body.String())
	}
	var got struct {
		Archivos []struct {
			Path   string `json:"path"`
			Bytes  int64  `json:"bytes"`
			Motivo string `json:"motivo"`
		} `json:"archivos"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil {
		t.Fatalf("Unmarshal(%s) = %v, want nil", rec.Body.String(), err)
	}
	if len(got.Archivos) != 2 || got.Archivos[0].Motivo != "" || got.Archivos[1].Motivo != almacenamiento.MotivoNoEsJPEG {
		t.Errorf("archivos = %+v, want el válido sin motivo y el inválido con motivo", got.Archivos)
	}
	if !almacen.desde.Equal(desde) || !almacen.hasta.Equal(hasta) {
		t.Errorf("ventana = %v a %v, want %v a %v", almacen.desde, almacen.hasta, desde, hasta)
	}
	if want := (almacenamiento.Limites{FotoBytes: limiteFoto, VideoBytes: limiteVideo}); almacen.limites != want {
		t.Errorf("limites = %+v, want %+v", almacen.limites, want)
	}
}

func TestListar_SinArchivosDevuelveListaVacia(t *testing.T) {
	r, _ := nuevoRouterTest()

	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, httptest.NewRequest(http.MethodGet,
		"/archivos?desde=2026-11-04T03:00:00Z&hasta=2026-11-05T03:00:00Z", nil))

	if rec.Code != http.StatusOK {
		t.Fatalf("GET /archivos status = %d, want %d", rec.Code, http.StatusOK)
	}
	if !strings.Contains(rec.Body.String(), `"archivos":[]`) {
		t.Errorf("body = %s, want una lista vacía y no null", rec.Body.String())
	}
}

func TestListar_FechasInvalidas(t *testing.T) {
	for _, query := range []string{
		"",
		"?desde=2026-11-04T03:00:00Z",
		"?hasta=2026-11-04T03:00:00Z",
		"?desde=ayer&hasta=hoy",
	} {
		t.Run(query, func(t *testing.T) {
			r, _ := nuevoRouterTest()

			rec := httptest.NewRecorder()
			r.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/archivos"+query, nil))

			if rec.Code != http.StatusBadRequest {
				t.Errorf("GET /archivos%s status = %d, want %d", query, rec.Code, http.StatusBadRequest)
			}
		})
	}
}

func TestListar_ErrorDelAlmacen(t *testing.T) {
	r, almacen := nuevoRouterTest()
	almacen.errListar = errors.New("disco roto")

	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, httptest.NewRequest(http.MethodGet,
		"/archivos?desde=2026-11-04T03:00:00Z&hasta=2026-11-05T03:00:00Z", nil))

	if rec.Code != http.StatusInternalServerError {
		t.Errorf("GET /archivos status = %d, want %d", rec.Code, http.StatusInternalServerError)
	}
}

func TestExisten_DevuelveLasQueFaltan(t *testing.T) {
	r, almacen := nuevoRouterTest()
	almacen.faltan = []string{"reportes/a/falta.jpg"}

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/existen",
		strings.NewReader(`{"paths":["reportes/a/esta.jpg","reportes/a/falta.jpg"]}`))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("POST /existen status = %d, want %d (body: %s)", rec.Code, http.StatusOK, rec.Body.String())
	}
	if want := `{"faltan":["reportes/a/falta.jpg"]}`; rec.Body.String() != want {
		t.Errorf("body = %s, want %s", rec.Body.String(), want)
	}
	if len(almacen.consultadas) != 2 {
		t.Errorf("rutas consultadas = %v, want 2", almacen.consultadas)
	}
}

func TestExisten_CuerpoInvalido(t *testing.T) {
	r, _ := nuevoRouterTest()

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/existen", strings.NewReader(`no es json`))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("POST /existen status = %d, want %d", rec.Code, http.StatusBadRequest)
	}
}

func TestCuarentena_MueveElArchivo(t *testing.T) {
	r, almacen := nuevoRouterTest()

	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, httptest.NewRequest(http.MethodPost, "/cuarentena/reportes/a/mal.jpg", nil))

	if rec.Code != http.StatusNoContent {
		t.Fatalf("POST /cuarentena status = %d, want %d (body: %s)", rec.Code, http.StatusNoContent, rec.Body.String())
	}
	if almacen.cuarentena != "reportes/a/mal.jpg" {
		t.Errorf("ruta en cuarentena = %q, want %q", almacen.cuarentena, "reportes/a/mal.jpg")
	}
}

func TestCuarentena_Errores(t *testing.T) {
	tests := []struct {
		name string
		err  error
		want int
	}{
		{name: "ruta no permitida", err: almacenamiento.ErrRutaNoPermitida, want: http.StatusBadRequest},
		{name: "fallo del almacén", err: errors.New("disco roto"), want: http.StatusInternalServerError},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			r, almacen := nuevoRouterTest()
			almacen.errCuarentena = tt.err

			rec := httptest.NewRecorder()
			r.ServeHTTP(rec, httptest.NewRequest(http.MethodPost, "/cuarentena/reportes/a/mal.jpg", nil))

			if rec.Code != tt.want {
				t.Errorf("POST /cuarentena status = %d, want %d", rec.Code, tt.want)
			}
		})
	}
}

func TestPurgarCuarentena(t *testing.T) {
	r, almacen := nuevoRouterTest()
	almacen.purgados = 3
	antes := time.Date(2026, 10, 20, 3, 0, 0, 0, time.UTC)

	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, httptest.NewRequest(http.MethodDelete, "/cuarentena?antes="+antes.Format(time.RFC3339), nil))

	if rec.Code != http.StatusOK {
		t.Fatalf("DELETE /cuarentena status = %d, want %d (body: %s)", rec.Code, http.StatusOK, rec.Body.String())
	}
	if want := `{"borrados":3}`; rec.Body.String() != want {
		t.Errorf("body = %s, want %s", rec.Body.String(), want)
	}
	if !almacen.purgadoAntes.Equal(antes) {
		t.Errorf("antes = %v, want %v", almacen.purgadoAntes, antes)
	}
}

func TestPurgarCuarentena_SinFecha(t *testing.T) {
	r, _ := nuevoRouterTest()

	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, httptest.NewRequest(http.MethodDelete, "/cuarentena", nil))

	if rec.Code != http.StatusBadRequest {
		t.Errorf("DELETE /cuarentena status = %d, want %d", rec.Code, http.StatusBadRequest)
	}
}
