package service

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"time"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/domain"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/procesamiento"
	"github.com/google/uuid"
)

// tiempoLimpieza es lo que se espera a borrar un archivo huérfano de multimedia.
const tiempoLimpieza = 10 * time.Second

// MultimediaStore es el subconjunto de *database.Store que este servicio usa.
type MultimediaStore interface {
	EsCreadorDeReporte(ctx context.Context, arg domain.EsCreadorDeReporteParams) (bool, error)
	CreateMultimedia(ctx context.Context, arg domain.CreateMultimediaParams) (domain.Multimedia, error)
}

// MultimediaCliente es lo que este servicio necesita del servicio multimedia, que solo
// guarda y borra archivos.
type MultimediaCliente interface {
	Subir(ctx context.Context, carpeta string, archivo io.Reader) (string, error)
	Borrar(ctx context.Context, path string) error
}

// OpcionesFoto reúne los límites con los que se valida una foto.
type OpcionesFoto struct {
	MaxBytes   int64 // tamaño máximo del archivo recibido
	MaxPixeles int64 // máximo de píxeles (ancho por alto)
}

type MultimediaService struct {
	store      MultimediaStore
	multimedia MultimediaCliente
	foto       OpcionesFoto
}

// NewMultimediaService crea un servicio de multimedia con la store, el cliente de multimedia y los límites de foto dados.
func NewMultimediaService(store MultimediaStore, multimedia MultimediaCliente, foto OpcionesFoto) *MultimediaService {
	return &MultimediaService{store: store, multimedia: multimedia, foto: foto}
}

// Subir valida la foto, le quita los metadatos y la guarda en multimedia a nombre del
// creador de un reporte. Si el reporte no existe o el usuario no es su creador
// devuelve ErrReporteNotFound, y si el usuario ya subió un archivo,
// ErrMultimediaYaExiste.
func (s *MultimediaService) Subir(ctx context.Context, reporteID, userID uuid.UUID, archivo io.Reader) (domain.Multimedia, error) {
	esCreador, err := s.store.EsCreadorDeReporte(ctx, domain.EsCreadorDeReporteParams{
		UserID:    userID,
		ReporteID: reporteID,
	})
	if err != nil {
		return domain.Multimedia{}, err
	}
	if !esCreador {
		return domain.Multimedia{}, domain.ErrReporteNotFound
	}

	jpeg, err := s.procesar(archivo)
	if err != nil {
		return domain.Multimedia{}, err
	}

	path, err := s.multimedia.Subir(ctx, "reportes/"+reporteID.String(), bytes.NewReader(jpeg))
	if err != nil {
		return domain.Multimedia{}, err
	}

	m, err := s.store.CreateMultimedia(ctx, domain.CreateMultimediaParams{
		ReporteID: reporteID,
		Path:      path,
		UserID:    userID,
	})
	if err != nil {
		s.borrarHuerfano(ctx, path)
		if domain.IsUniqueViolation(err) {
			return domain.Multimedia{}, domain.ErrMultimediaYaExiste
		}
		return domain.Multimedia{}, err
	}
	return m, nil
}

// procesar lee la foto, comprueba que sea un JPEG permitido y devuelve su
// versión sin metadatos.
func (s *MultimediaService) procesar(archivo io.Reader) ([]byte, error) {
	original, err := io.ReadAll(io.LimitReader(archivo, s.foto.MaxBytes+1))
	if err != nil {
		return nil, fmt.Errorf("leer archivo: %w", err)
	}
	if int64(len(original)) > s.foto.MaxBytes {
		return nil, domain.ErrArchivoMuyGrande
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

// errorDeProcesamiento traduce los errores de la imagen a errores de dominio.
// Cualquier otro se devuelve tal cual.
func errorDeProcesamiento(err error) error {
	switch {
	case errors.Is(err, procesamiento.ErrFormatoNoSoportado):
		return fmt.Errorf("%w: formato de imagen no soportado", domain.ErrArchivoInvalido)
	case errors.Is(err, procesamiento.ErrImagenMuyGrande):
		return domain.ErrImagenMuyGrande
	default:
		return err
	}
}

// borrarHuerfano borra de multimedia un archivo que no llegó a registrarse en la
// base. Usa un contexto propio para que se borre aunque el cliente haya
// cancelado la petición; si falla solo lo registra.
func (s *MultimediaService) borrarHuerfano(ctx context.Context, path string) {
	ctx, cancel := context.WithTimeout(context.WithoutCancel(ctx), tiempoLimpieza)
	defer cancel()

	if err := s.multimedia.Borrar(ctx, path); err != nil {
		slog.WarnContext(ctx, "couldn't delete an orphan file", "path", path, "error", err)
	}
}
