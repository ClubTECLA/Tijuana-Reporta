package server_test

// Tests de integración de POST /reportes/{id}/multimedia: el router real con su
// validación de OpenAPI y su límite de body, contra Postgres. El servicio multimedia
// se sustituye por un falso, porque vive en otro módulo.

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"image"
	"image/jpeg"
	"image/png"
	"io"
	"math/rand"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/almacen"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/httpapi"
)

// multimediaFalso hace de servicio multimedia: guarda lo que recibe y anota lo que se borra.
type multimediaFalso struct {
	subidas  []archivoSubido
	borrados []string

	subirErr error
}

type archivoSubido struct {
	carpeta   string
	path      string
	contenido []byte
}

func (m *multimediaFalso) Subir(_ context.Context, carpeta string, archivo io.Reader) (string, error) {
	if m.subirErr != nil {
		return "", m.subirErr
	}
	contenido, err := io.ReadAll(archivo)
	if err != nil {
		return "", err
	}
	path := fmt.Sprintf("%s/falso%d.jpg", carpeta, len(m.subidas)+1)
	m.subidas = append(m.subidas, archivoSubido{carpeta: carpeta, path: path, contenido: contenido})
	return path, nil
}

func (m *multimediaFalso) Borrar(_ context.Context, path string) error {
	m.borrados = append(m.borrados, path)
	return nil
}

// subir manda un multipart con el contenido en el campo dado.
func (c *testClient) subir(reporteID, campo string, contenido []byte) *httptest.ResponseRecorder {
	c.t.Helper()

	var buf bytes.Buffer
	w := multipart.NewWriter(&buf)
	fw, err := w.CreateFormFile(campo, "foto.jpg")
	if err != nil {
		c.t.Fatalf("CreateFormFile() = %v", err)
	}
	fw.Write(contenido)
	w.Close()

	req := httptest.NewRequest(http.MethodPost, "/v1/reportes/"+reporteID+"/multimedia", &buf)
	req.Header.Set("Content-Type", w.FormDataContentType())
	if c.token != "" {
		req.Header.Set("Authorization", "Bearer "+c.token)
	}
	rec := httptest.NewRecorder()
	c.router.ServeHTTP(rec, req)
	return rec
}

// bytesDe devuelve n bytes distintos entre sí, para notar si algo se corta o se altera.
func bytesDe(n int) []byte {
	b := make([]byte, n)
	for i := range b {
		b[i] = byte(i*7 + i/251)
	}
	return b
}

// jpegRuidoso devuelve un JPEG de ancho x alto con ruido, que pesa mucho porque
// casi no se comprime.
func jpegRuidoso(t *testing.T, ancho, alto int) []byte {
	t.Helper()

	img := image.NewNRGBA(image.Rect(0, 0, ancho, alto))
	rand.New(rand.NewSource(1)).Read(img.Pix)
	for i := 3; i < len(img.Pix); i += 4 {
		img.Pix[i] = 255
	}
	var buf bytes.Buffer
	if err := jpeg.Encode(&buf, img, nil); err != nil {
		t.Fatalf("jpeg.Encode() = %v", err)
	}
	return buf.Bytes()
}

// conExif inserta un segmento EXIF con texto justo después del SOI del JPEG.
func conExif(foto []byte, texto string) []byte {
	largo := len("Exif\x00\x00"+texto) + 2
	exif := append([]byte{0xFF, 0xE1, byte(largo >> 8), byte(largo)}, "Exif\x00\x00"+texto...)
	return append(append(append([]byte{}, foto[:2]...), exif...), foto[2:]...)
}

// pngLiso devuelve un PNG liso de ancho x alto píxeles.
func pngLiso(t *testing.T, ancho, alto int) []byte {
	t.Helper()

	var buf bytes.Buffer
	if err := png.Encode(&buf, image.NewRGBA(image.Rect(0, 0, ancho, alto))); err != nil {
		t.Fatalf("png.Encode() = %v", err)
	}
	return buf.Bytes()
}

func TestSubirMultimedia(t *testing.T) {
	c := newTestClient(t)
	c.login()
	reporte := c.crearReporte()
	// Pesa más de 1 MiB, el límite del resto de la API, y debe llegar completa
	// pero sin el EXIF.
	foto := conExif(jpegRuidoso(t, 3000, 1200), "GPS-SECRETO")
	if len(foto) < 1<<20 || len(foto) > 3<<20 {
		t.Fatalf("la foto de prueba pesa %d bytes, quería entre 1 y 3 MiB", len(foto))
	}

	rec := c.subir(reporte.Id.String(), "file", foto)

	if rec.Code != http.StatusCreated {
		t.Fatalf("status = %d, quería %d; body: %s", rec.Code, http.StatusCreated, rec.Body)
	}
	m := decode[httpapi.Multimedia](t, rec)
	wantPath := "reportes/" + reporte.Id.String() + "/falso1.jpg"
	if m.Path != wantPath {
		t.Errorf("path = %q, quería %q", m.Path, wantPath)
	}
	if len(c.multimedia.subidas) != 1 {
		t.Fatalf("multimedia recibió %d archivo(s), quería 1", len(c.multimedia.subidas))
	}
	recibido := c.multimedia.subidas[0].contenido
	cfg, err := jpeg.DecodeConfig(bytes.NewReader(recibido))
	if err != nil {
		t.Fatalf("lo que recibió multimedia no es un JPEG: %v", err)
	}
	if cfg.Width != 3000 || cfg.Height != 1200 {
		t.Errorf("tamaño enviado a multimedia = %dx%d, quería 3000x1200 (sin reescalar)", cfg.Width, cfg.Height)
	}
	if bytes.Contains(recibido, []byte("GPS-SECRETO")) {
		t.Error("multimedia recibió la foto con el EXIF")
	}

	rec = c.expect(http.StatusOK, http.MethodGet, "/v1/reportes/"+reporte.Id.String(), nil)
	obtenido := decode[httpapi.Reporte](t, rec)
	if len(obtenido.Multimedia) != 1 || obtenido.Multimedia[0].Path != wantPath {
		t.Errorf("multimedia del reporte = %+v, quería un archivo con path %q", obtenido.Multimedia, wantPath)
	}
}

func TestSubirMultimedia_SoloElCreador(t *testing.T) {
	creador := newTestClient(t)
	creador.login()
	reporte := creador.crearReporte()

	otro := newTestClient(t)
	otro.login()
	rec := otro.subir(reporte.Id.String(), "file", bytesDe(1000))

	if rec.Code != http.StatusNotFound {
		t.Errorf("status = %d, quería %d; body: %s", rec.Code, http.StatusNotFound, rec.Body)
	}
	if len(otro.multimedia.subidas) != 0 {
		t.Errorf("multimedia recibió %d archivo(s), quería 0", len(otro.multimedia.subidas))
	}
}

func TestSubirMultimedia_ReporteInexistente(t *testing.T) {
	c := newTestClient(t)
	c.login()

	rec := c.subir("3f2f7d3e-1111-4222-8333-444455556666", "file", bytesDe(1000))

	if rec.Code != http.StatusNotFound {
		t.Errorf("status = %d, quería %d; body: %s", rec.Code, http.StatusNotFound, rec.Body)
	}
}

func TestSubirMultimedia_SegundaVezEs409YBorraElArchivo(t *testing.T) {
	c := newTestClient(t)
	c.login()
	reporte := c.crearReporte()
	c.subir(reporte.Id.String(), "file", jpegRuidoso(t, 20, 20))

	rec := c.subir(reporte.Id.String(), "file", jpegRuidoso(t, 30, 30))

	if rec.Code != http.StatusConflict {
		t.Fatalf("status = %d, quería %d; body: %s", rec.Code, http.StatusConflict, rec.Body)
	}
	want := "reportes/" + reporte.Id.String() + "/falso2.jpg"
	if len(c.multimedia.borrados) != 1 || c.multimedia.borrados[0] != want {
		t.Errorf("borrados = %v, quería [%q] (el segundo archivo, que no se registró)", c.multimedia.borrados, want)
	}

	rec = c.expect(http.StatusOK, http.MethodGet, "/v1/reportes/"+reporte.Id.String(), nil)
	if obtenido := decode[httpapi.Reporte](t, rec); len(obtenido.Multimedia) != 1 {
		t.Errorf("el reporte tiene %d archivos, quería 1", len(obtenido.Multimedia))
	}
}

func TestSubirMultimedia_SinToken(t *testing.T) {
	c := newTestClient(t)

	rec := c.subir("3f2f7d3e-1111-4222-8333-444455556666", "file", bytesDe(100))

	if rec.Code != http.StatusUnauthorized {
		t.Errorf("status = %d, quería %d", rec.Code, http.StatusUnauthorized)
	}
}

func TestSubirMultimedia_ReporteIdInvalido(t *testing.T) {
	c := newTestClient(t)
	c.login()

	rec := c.subir("no-es-un-uuid", "file", bytesDe(100))

	if rec.Code != http.StatusBadRequest {
		t.Errorf("status = %d, quería %d", rec.Code, http.StatusBadRequest)
	}
}

func TestSubirMultimedia_SinElCampoFile(t *testing.T) {
	c := newTestClient(t)
	c.login()
	reporte := c.crearReporte()

	rec := c.subir(reporte.Id.String(), "otro", bytesDe(100))

	if rec.Code != http.StatusBadRequest {
		t.Errorf("status = %d, quería %d; body: %s", rec.Code, http.StatusBadRequest, rec.Body)
	}
	if len(c.multimedia.subidas) != 0 {
		t.Errorf("multimedia recibió %d archivo(s), quería 0", len(c.multimedia.subidas))
	}
}

func TestSubirMultimedia_DemasiadoGrande(t *testing.T) {
	c := newTestClient(t)
	c.login()
	reporte := c.crearReporte()

	// 13 MiB pasa el máximo de 12 MiB de la ruta.
	rec := c.subir(reporte.Id.String(), "file", bytesDe(13<<20))

	if rec.Code != http.StatusRequestEntityTooLarge {
		t.Errorf("status = %d, quería %d", rec.Code, http.StatusRequestEntityTooLarge)
	}
	if len(c.multimedia.subidas) != 0 {
		t.Errorf("multimedia recibió %d archivo(s), quería 0", len(c.multimedia.subidas))
	}
}

// El límite grande es solo de la ruta de multimedia; el resto de la API sigue en 1 MiB.
func TestLimiteDeBody_LasOtrasRutasSiguenEn1MiB(t *testing.T) {
	c := newTestClient(t)
	c.login()
	reporte := c.crearReporte()

	rec := c.do(http.MethodPost, "/v1/reportes/"+reporte.Id.String()+"/comentarios",
		map[string]any{"comentario": string(bytes.Repeat([]byte("a"), 2<<20))})

	if rec.Code != http.StatusRequestEntityTooLarge {
		t.Errorf("status = %d, quería %d", rec.Code, http.StatusRequestEntityTooLarge)
	}
}

// Un archivo que no es JPEG se rechaza sin llegar a multimedia.
func TestSubirMultimedia_FormatoNoSoportado(t *testing.T) {
	archivos := map[string][]byte{
		"bytes cualquiera": bytesDe(1000),
		"png":              pngLiso(t, 20, 20),
	}

	for name, archivo := range archivos {
		t.Run(name, func(t *testing.T) {
			c := newTestClient(t)
			c.login()
			reporte := c.crearReporte()

			rec := c.subir(reporte.Id.String(), "file", archivo)

			if rec.Code != http.StatusBadRequest {
				t.Errorf("status = %d, quería %d; body: %s", rec.Code, http.StatusBadRequest, rec.Body)
			}
			if len(c.multimedia.subidas) != 0 {
				t.Errorf("multimedia recibió %d archivo(s), quería 0", len(c.multimedia.subidas))
			}
		})
	}
}

// Pasa el límite del body (12 MiB) pero no el de la foto (3 MiB).
func TestSubirMultimedia_FotoMasGrandeQueElLimite(t *testing.T) {
	c := newTestClient(t)
	c.login()
	reporte := c.crearReporte()

	rec := c.subir(reporte.Id.String(), "file", bytesDe(4<<20))

	if rec.Code != http.StatusRequestEntityTooLarge {
		t.Errorf("status = %d, quería %d; body: %s", rec.Code, http.StatusRequestEntityTooLarge, rec.Body)
	}
	if len(c.multimedia.subidas) != 0 {
		t.Errorf("multimedia recibió %d archivo(s), quería 0", len(c.multimedia.subidas))
	}
}

func TestSubirMultimedia_ErroresDeMultimedia(t *testing.T) {
	tests := []struct {
		name          string
		errMultimedia error
		want          int
	}{
		{name: "almacenamiento caído", errMultimedia: fmt.Errorf("%w: connection refused", almacen.ErrNoDisponible), want: http.StatusServiceUnavailable},
		{name: "error inesperado", errMultimedia: errors.New("multimedia respondió 400 en 10.0.0.5"), want: http.StatusInternalServerError},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			c := newTestClient(t)
			c.login()
			reporte := c.crearReporte()
			c.multimedia.subirErr = tt.errMultimedia

			rec := c.subir(reporte.Id.String(), "file", jpegRuidoso(t, 20, 20))

			if rec.Code != tt.want {
				t.Fatalf("status = %d, quería %d; body: %s", rec.Code, tt.want, rec.Body)
			}
			if bytes.Contains(rec.Body.Bytes(), []byte("10.0.0.5")) || bytes.Contains(rec.Body.Bytes(), []byte("refused")) {
				t.Errorf("la respuesta filtra el detalle interno: %s", rec.Body)
			}
		})
	}
}
