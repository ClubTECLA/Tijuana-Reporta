package service

import (
	"bytes"
	"context"
	"errors"
	"image"
	"image/jpeg"
	"image/png"
	"io"
	"strings"
	"testing"
	"time"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/db/sqlc"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/domain"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgconn"
)

// fakeMultimediaStore implementa MultimediaStore en memoria. creadores guarda
// los pares (usuario, reporte) que cuentan como creador.
type fakeMultimediaStore struct {
	creadores map[sqlc.EsCreadorDeReporteParams]bool
	creados   []sqlc.CreateMultimediaParams

	esCreadorErr error
	createErr    error
}

func (f *fakeMultimediaStore) EsCreadorDeReporte(_ context.Context, arg sqlc.EsCreadorDeReporteParams) (bool, error) {
	if f.esCreadorErr != nil {
		return false, f.esCreadorErr
	}
	return f.creadores[arg], nil
}

func (f *fakeMultimediaStore) CreateMultimedia(_ context.Context, arg sqlc.CreateMultimediaParams) (sqlc.Multimedia, error) {
	if f.createErr != nil {
		return sqlc.Multimedia{}, f.createErr
	}
	f.creados = append(f.creados, arg)
	return sqlc.Multimedia{ID: len(f.creados), ReporteID: arg.ReporteID, Path: arg.Path, UserID: arg.UserID, CreatedAt: time.Now()}, nil
}

// fakeMultimedia implementa MultimediaCliente: guarda lo que recibe y lo que se borra.
type fakeMultimedia struct {
	subidas  []string // carpetas
	leido    string   // contenido que recibió
	borrados []string

	subirErr  error
	borrarErr error
}

func (f *fakeMultimedia) Subir(_ context.Context, carpeta string, archivo io.Reader) (string, error) {
	if f.subirErr != nil {
		return "", f.subirErr
	}
	contenido, _ := io.ReadAll(archivo)
	f.leido = string(contenido)
	f.subidas = append(f.subidas, carpeta)
	return carpeta + "/abc.jpg", nil
}

func (f *fakeMultimedia) Borrar(_ context.Context, path string) error {
	f.borrados = append(f.borrados, path)
	return f.borrarErr
}

// opcionesFotoTest son los límites de los tests: 100 KiB y 10.000 píxeles.
var opcionesFotoTest = OpcionesFoto{MaxBytes: 100 << 10, MaxPixeles: 10_000}

// fotoJPEG devuelve un JPEG liso de ancho x alto píxeles.
func fotoJPEG(t *testing.T, ancho, alto int) []byte {
	t.Helper()

	var buf bytes.Buffer
	if err := jpeg.Encode(&buf, image.NewRGBA(image.Rect(0, 0, ancho, alto)), nil); err != nil {
		t.Fatalf("jpeg.Encode() = %v, want nil", err)
	}
	return buf.Bytes()
}

// fotoPNG devuelve un PNG liso de ancho x alto píxeles.
func fotoPNG(t *testing.T, ancho, alto int) []byte {
	t.Helper()

	var buf bytes.Buffer
	if err := png.Encode(&buf, image.NewRGBA(image.Rect(0, 0, ancho, alto))); err != nil {
		t.Fatalf("png.Encode() = %v, want nil", err)
	}
	return buf.Bytes()
}

func nuevoMultimediaService(reporteID, userID uuid.UUID) (*MultimediaService, *fakeMultimediaStore, *fakeMultimedia) {
	store := &fakeMultimediaStore{creadores: map[sqlc.EsCreadorDeReporteParams]bool{
		{UserID: userID, ReporteID: reporteID}: true,
	}}
	multimedia := &fakeMultimedia{}
	return NewMultimediaService(store, multimedia, opcionesFotoTest), store, multimedia
}

func TestMultimediaService_Subir(t *testing.T) {
	reporteID, userID := uuid.New(), uuid.New()
	svc, store, multimedia := nuevoMultimediaService(reporteID, userID)

	m, err := svc.Subir(context.Background(), reporteID, userID, bytes.NewReader(fotoJPEG(t, 10, 10)))
	if err != nil {
		t.Fatalf("Subir() error = %v, want nil", err)
	}

	wantPath := "reportes/" + reporteID.String() + "/abc.jpg"
	if m.Path != wantPath || m.ReporteID != reporteID || m.UserID != userID {
		t.Errorf("Subir() = %+v, want path=%q reporte=%v user=%v", m, wantPath, reporteID, userID)
	}
	if _, err := jpeg.DecodeConfig(strings.NewReader(multimedia.leido)); err != nil {
		t.Errorf("multimedia recibió algo que no es un JPEG: %v", err)
	}
	if len(store.creados) != 1 || store.creados[0].Path != wantPath {
		t.Errorf("CreateMultimedia recibió %+v, want una fila con path %q", store.creados, wantPath)
	}
	if len(multimedia.borrados) != 0 {
		t.Errorf("se borró %v, want nada si todo salió bien", multimedia.borrados)
	}
}

func TestMultimediaService_Subir_SoloElCreador(t *testing.T) {
	reporteID, creador := uuid.New(), uuid.New()
	svc, store, multimedia := nuevoMultimediaService(reporteID, creador)

	tests := []struct {
		name      string
		reporteID uuid.UUID
		userID    uuid.UUID
	}{
		{name: "otro usuario", reporteID: reporteID, userID: uuid.New()},
		{name: "reporte que no existe", reporteID: uuid.New(), userID: creador},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := svc.Subir(context.Background(), tt.reporteID, tt.userID, bytes.NewReader(fotoJPEG(t, 10, 10)))

			if !errors.Is(err, domain.ErrReporteNotFound) {
				t.Errorf("Subir() error = %v, want %v", err, domain.ErrReporteNotFound)
			}
			if len(multimedia.subidas) != 0 || len(store.creados) != 0 {
				t.Errorf("se subió %v y se registró %v, want nada si no es el creador", multimedia.subidas, store.creados)
			}
		})
	}
}

func TestMultimediaService_Subir_ErrorAlConsultarElCreador(t *testing.T) {
	reporteID, userID := uuid.New(), uuid.New()
	svc, _, multimedia := nuevoMultimediaService(reporteID, userID)
	svc.store.(*fakeMultimediaStore).esCreadorErr = errors.New("base caída")

	_, err := svc.Subir(context.Background(), reporteID, userID, bytes.NewReader(fotoJPEG(t, 10, 10)))

	if err == nil || errors.Is(err, domain.ErrReporteNotFound) {
		t.Errorf("Subir() error = %v, want un error que no sea ErrReporteNotFound", err)
	}
	if len(multimedia.subidas) != 0 {
		t.Errorf("se subió %v, want nada", multimedia.subidas)
	}
}

// La foto llega a multimedia sin el EXIF, que puede traer la ubicación de quien la tomó.
func TestMultimediaService_Subir_QuitaLosMetadatos(t *testing.T) {
	reporteID, userID := uuid.New(), uuid.New()
	svc, _, multimedia := nuevoMultimediaService(reporteID, userID)
	foto := fotoJPEG(t, 10, 10)
	exif := append([]byte{0xFF, 0xE1, 0x00, 0x13}, "Exif\x00\x00GPS-SECRETO"...)
	conExif := append(append(append([]byte{}, foto[:2]...), exif...), foto[2:]...)

	if _, err := svc.Subir(context.Background(), reporteID, userID, bytes.NewReader(conExif)); err != nil {
		t.Fatalf("Subir() error = %v, want nil", err)
	}

	if strings.Contains(multimedia.leido, "GPS-SECRETO") {
		t.Error("multimedia recibió la foto con el EXIF")
	}
	if _, err := jpeg.DecodeConfig(strings.NewReader(multimedia.leido)); err != nil {
		t.Errorf("multimedia recibió algo que no es un JPEG: %v", err)
	}
}

// Una foto inválida se rechaza sin llegar a multimedia ni a la base.
func TestMultimediaService_Subir_FotoRechazada(t *testing.T) {
	tests := []struct {
		name    string
		archivo []byte
		want    error
	}{
		{name: "texto plano", archivo: []byte("esto no es una imagen"), want: domain.ErrArchivoInvalido},
		{name: "archivo vacío", archivo: []byte{}, want: domain.ErrArchivoInvalido},
		{name: "pesa más del máximo", archivo: bytes.Repeat([]byte("x"), int(opcionesFotoTest.MaxBytes)+1), want: domain.ErrArchivoMuyGrande},
		{name: "más píxeles del máximo", archivo: fotoJPEG(t, 200, 200), want: domain.ErrImagenMuyGrande},
		{name: "png", archivo: fotoPNG(t, 10, 10), want: domain.ErrArchivoInvalido},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			reporteID, userID := uuid.New(), uuid.New()
			svc, store, multimedia := nuevoMultimediaService(reporteID, userID)

			_, err := svc.Subir(context.Background(), reporteID, userID, bytes.NewReader(tt.archivo))

			if !errors.Is(err, tt.want) {
				t.Errorf("Subir() error = %v, want %v", err, tt.want)
			}
			if len(multimedia.subidas) != 0 || len(store.creados) != 0 {
				t.Errorf("se subió %v y se registró %v, want nada", multimedia.subidas, store.creados)
			}
		})
	}
}

func TestMultimediaService_Subir_ErroresDeMultimedia(t *testing.T) {
	for _, errMultimedia := range []error{
		domain.ErrAlmacenNoDisponible,
		errors.New("multimedia respondió 400"),
	} {
		t.Run(errMultimedia.Error(), func(t *testing.T) {
			reporteID, userID := uuid.New(), uuid.New()
			svc, store, multimedia := nuevoMultimediaService(reporteID, userID)
			multimedia.subirErr = errMultimedia

			_, err := svc.Subir(context.Background(), reporteID, userID, bytes.NewReader(fotoJPEG(t, 10, 10)))

			if !errors.Is(err, errMultimedia) {
				t.Errorf("Subir() error = %v, want %v", err, errMultimedia)
			}
			if len(store.creados) != 0 {
				t.Errorf("se registró %v, want nada si multimedia falló", store.creados)
			}
			if len(multimedia.borrados) != 0 {
				t.Errorf("se borró %v, want nada si multimedia no guardó", multimedia.borrados)
			}
		})
	}
}

func TestMultimediaService_Subir_YaSubioUnArchivo(t *testing.T) {
	reporteID, userID := uuid.New(), uuid.New()
	svc, store, multimedia := nuevoMultimediaService(reporteID, userID)
	store.createErr = &pgconn.PgError{Code: "23505", ConstraintName: "multimedia_reporte_id_user_id_key"}

	_, err := svc.Subir(context.Background(), reporteID, userID, bytes.NewReader(fotoJPEG(t, 10, 10)))

	if !errors.Is(err, domain.ErrMultimediaYaExiste) {
		t.Errorf("Subir() error = %v, want %v", err, domain.ErrMultimediaYaExiste)
	}
	wantBorrado := "reportes/" + reporteID.String() + "/abc.jpg"
	if len(multimedia.borrados) != 1 || multimedia.borrados[0] != wantBorrado {
		t.Errorf("borrados = %v, want [%q] (el archivo huérfano)", multimedia.borrados, wantBorrado)
	}
}

func TestMultimediaService_Subir_ErrorAlRegistrarBorraElArchivo(t *testing.T) {
	reporteID, userID := uuid.New(), uuid.New()
	svc, store, multimedia := nuevoMultimediaService(reporteID, userID)
	errBase := errors.New("base caída")
	store.createErr = errBase

	_, err := svc.Subir(context.Background(), reporteID, userID, bytes.NewReader(fotoJPEG(t, 10, 10)))

	if !errors.Is(err, errBase) {
		t.Errorf("Subir() error = %v, want %v", err, errBase)
	}
	if len(multimedia.borrados) != 1 {
		t.Errorf("borrados = %v, want 1 archivo huérfano borrado", multimedia.borrados)
	}
}

// Si no se puede borrar el huérfano, el error que ve el cliente sigue siendo el
// original; el fallo de la limpieza solo se registra.
func TestMultimediaService_Subir_FalloDeLimpiezaNoCambiaElError(t *testing.T) {
	reporteID, userID := uuid.New(), uuid.New()
	svc, store, multimedia := nuevoMultimediaService(reporteID, userID)
	store.createErr = &pgconn.PgError{Code: "23505"}
	multimedia.borrarErr = errors.New("multimedia caído")

	_, err := svc.Subir(context.Background(), reporteID, userID, bytes.NewReader(fotoJPEG(t, 10, 10)))

	if !errors.Is(err, domain.ErrMultimediaYaExiste) {
		t.Errorf("Subir() error = %v, want %v", err, domain.ErrMultimediaYaExiste)
	}
}

// La limpieza debe correr aunque el cliente haya cancelado la petición.
func TestMultimediaService_Subir_LimpiaConElContextoCancelado(t *testing.T) {
	reporteID, userID := uuid.New(), uuid.New()
	svc, store, _ := nuevoMultimediaService(reporteID, userID)
	store.createErr = errors.New("base caída")
	multimedia := &fakeMultimediaContexto{}
	svc.multimedia = multimedia

	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	svc.Subir(ctx, reporteID, userID, bytes.NewReader(fotoJPEG(t, 10, 10)))

	if !multimedia.borrado {
		t.Fatal("Borrar no se llamó")
	}
	if multimedia.errContexto != nil {
		t.Errorf("el contexto de Borrar estaba cancelado (%v), want activo", multimedia.errContexto)
	}
}

// fakeMultimediaContexto anota si se llamó a Borrar y si su contexto ya estaba
// cancelado en ese momento.
type fakeMultimediaContexto struct {
	borrado     bool
	errContexto error
}

func (f *fakeMultimediaContexto) Subir(_ context.Context, carpeta string, _ io.Reader) (string, error) {
	return carpeta + "/abc.jpg", nil
}

func (f *fakeMultimediaContexto) Borrar(ctx context.Context, _ string) error {
	f.borrado = true
	f.errContexto = ctx.Err()
	return nil
}
