package multimedia

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"time"

	"github.com/ClubTECLA/cimalert/backend/internal/db"
	"github.com/ClubTECLA/cimalert/backend/internal/db/sqlc"
	"github.com/ClubTECLA/cimalert/backend/internal/multimedia/procesamiento"
	"github.com/google/uuid"
)

// tiempoLimpieza es lo que se espera a borrar un archivo huérfano de multimedia.
const tiempoLimpieza = 10 * time.Second

// store es lo que el servicio necesita de la base; *sqlc.Queries lo cumple
// y los tests lo cumplen con un falso en memoria.
type store interface {
	EsCreadorDeReporte(ctx context.Context, arg sqlc.EsCreadorDeReporteParams) (bool, error)
	CreateMultimedia(ctx context.Context, arg sqlc.CreateMultimediaParams) (sqlc.Multimedia, error)
}

// Cliente es lo que este servicio necesita del servicio multimedia, que solo
// guarda y borra archivos.
type Cliente interface {
	Subir(ctx context.Context, carpeta, extension string, archivo io.Reader) (string, error)
	Borrar(ctx context.Context, path string) error
}

// OpcionesFoto reúne los límites con los que se valida una foto.
type OpcionesFoto struct {
	MaxBytes   int64 // tamaño máximo del archivo recibido
	MaxPixeles int64 // máximo de píxeles (ancho por alto)
}

// OpcionesVideo reúne los límites con los que se valida un video.
type OpcionesVideo struct {
	MaxBytes    int64         // tamaño máximo del archivo recibido
	MaxDuracion time.Duration // duración máxima
}

type Service struct {
	store      store
	multimedia Cliente
	foto       OpcionesFoto
	video      OpcionesVideo
}

// NewService crea un servicio de multimedia con la store, el cliente de multimedia y los límites de foto y de video dados.
func NewService(store store, multimedia Cliente, foto OpcionesFoto, video OpcionesVideo) *Service {
	return &Service{store: store, multimedia: multimedia, foto: foto, video: video}
}

// Subir valida la foto o el video, le quita los metadatos y lo guarda en multimedia a nombre del
// creador de un reporte. Si el reporte no existe o el usuario no es su creador
// devuelve ErrReporteNotFound, y si el usuario ya subió un archivo,
// ErrMultimediaYaExiste.
func (s *Service) Subir(ctx context.Context, reporteID, userID uuid.UUID, archivo io.Reader) (sqlc.Multimedia, error) {
	esCreador, err := s.store.EsCreadorDeReporte(ctx, sqlc.EsCreadorDeReporteParams{
		UserID:    userID,
		ReporteID: reporteID,
	})
	if err != nil {
		return sqlc.Multimedia{}, err
	}
	if !esCreador {
		return sqlc.Multimedia{}, ErrReporteNotFound
	}

	contenido, tipo, err := s.procesar(archivo)
	if err != nil {
		return sqlc.Multimedia{}, err
	}

	path, err := s.multimedia.Subir(ctx, "reportes/"+reporteID.String(), string(tipo), bytes.NewReader(contenido))
	if err != nil {
		return sqlc.Multimedia{}, err
	}

	m, err := s.store.CreateMultimedia(ctx, sqlc.CreateMultimediaParams{
		ReporteID: reporteID,
		Path:      path,
		UserID:    userID,
	})
	if err != nil {
		s.borrarHuerfano(ctx, path)
		if db.IsUniqueViolation(err) {
			return sqlc.Multimedia{}, ErrYaExiste
		}
		return sqlc.Multimedia{}, err
	}
	return m, nil
}

// procesar lee el archivo, detecta si es una foto (JPEG) o un video (MP4), lo valida
// con los límites de su tipo y devuelve su versión sin metadatos.
func (s *Service) procesar(archivo io.Reader) ([]byte, procesamiento.Tipo, error) {
	maxGeneral := max(s.foto.MaxBytes, s.video.MaxBytes)
	original, err := io.ReadAll(io.LimitReader(archivo, maxGeneral+1))
	if err != nil {
		return nil, "", fmt.Errorf("leer archivo: %w", err)
	}
	if int64(len(original)) > maxGeneral {
		return nil, "", ErrArchivoMuyGrande
	}

	tipo, err := procesamiento.DetectarTipo(original)
	if err != nil {
		// Lo que no es video se mide con el límite de la foto, como antes de aceptar videos.
		if int64(len(original)) > s.foto.MaxBytes {
			return nil, "", ErrArchivoMuyGrande
		}
		return nil, "", errorDeProcesamiento(err)
	}

	var limpio []byte
	switch tipo {
	case procesamiento.TipoVideo:
		limpio, err = s.procesarVideo(original)
	default:
		limpio, err = s.procesarFoto(original)
	}
	if err != nil {
		return nil, "", err
	}
	return limpio, tipo, nil
}

// procesarFoto comprueba que original sea un JPEG permitido y devuelve su versión sin metadatos.
func (s *Service) procesarFoto(original []byte) ([]byte, error) {
	if int64(len(original)) > s.foto.MaxBytes {
		return nil, ErrArchivoMuyGrande
	}
	if err := procesamiento.ValidarImagen(bytes.NewReader(original), s.foto.MaxPixeles); err != nil {
		return nil, errorDeProcesamiento(err)
	}
	limpia, err := procesamiento.QuitarMetadatos(original)
	if err != nil {
		return nil, errorDeProcesamiento(err)
	}
	return limpia, nil
}

// procesarVideo comprueba que original sea un MP4 permitido y devuelve su versión sin metadatos.
func (s *Service) procesarVideo(original []byte) ([]byte, error) {
	if int64(len(original)) > s.video.MaxBytes {
		return nil, ErrArchivoMuyGrande
	}
	limpio, err := procesamiento.ProcesarVideo(original, s.video.MaxDuracion)
	if err != nil {
		return nil, errorDeProcesamiento(err)
	}
	return limpio, nil
}

// errorDeProcesamiento traduce los errores de la imagen o del video a errores de dominio.
// Cualquier otro se devuelve tal cual.
func errorDeProcesamiento(err error) error {
	switch {
	case errors.Is(err, procesamiento.ErrFormatoNoSoportado):
		return fmt.Errorf("%w: formato no soportado (solo JPEG o MP4): %v", ErrArchivoInvalido, err)
	case errors.Is(err, procesamiento.ErrImagenMuyGrande):
		return ErrImagenMuyGrande
	case errors.Is(err, procesamiento.ErrVideoMuyLargo):
		return ErrVideoMuyLargo
	default:
		return err
	}
}

// borrarHuerfano borra de multimedia un archivo que no llegó a registrarse en la
// base. Usa un contexto propio para que se borre aunque el cliente haya
// cancelado la petición; si falla solo lo registra.
func (s *Service) borrarHuerfano(ctx context.Context, path string) {
	ctx, cancel := context.WithTimeout(context.WithoutCancel(ctx), tiempoLimpieza)
	defer cancel()

	if err := s.multimedia.Borrar(ctx, path); err != nil {
		slog.WarnContext(ctx, "couldn't delete an orphan file", "path", path, "error", err)
	}
}
