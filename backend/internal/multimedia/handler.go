package multimedia

import (
	"context"
	"errors"
	"io"
	"mime/multipart"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/db/sqlc"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/httpapi"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/httperr"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/middleware"
)

// campoArchivo es el campo del multipart que lleva el archivo.
const campoArchivo = "file"

var errFaltaArchivo = errors.New("falta el campo file")

// Handler implementa las operaciones de multimedia del contrato; el servidor
// lo embebe junto con los de las demás funcionalidades.
type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

func toMultimedia(m sqlc.Multimedia) httpapi.Multimedia {
	return httpapi.Multimedia{CreatedAt: m.CreatedAt, Id: m.ID, Path: m.Path, UserId: m.UserID}
}

// archivoDelMultipart avanza hasta la parte "file" y la devuelve sin leerla.
func archivoDelMultipart(r *multipart.Reader) (*multipart.Part, error) {
	for {
		parte, err := r.NextPart()
		if errors.Is(err, io.EOF) {
			return nil, errFaltaArchivo
		}
		if err != nil {
			return nil, err
		}
		if parte.FormName() == campoArchivo {
			return parte, nil
		}
	}
}

// SubirMultimedia guarda la foto que el creador de un reporte sube a su reporte.
func (h *Handler) SubirMultimedia(ctx context.Context, request httpapi.SubirMultimediaRequestObject) (httpapi.SubirMultimediaResponseObject, error) {
	userID, ok := middleware.UserIDFromContext(ctx)
	if !ok {
		return nil, httperr.ErrNoAutenticado
	}

	archivo, err := archivoDelMultipart(request.Body)
	if err != nil {
		if errors.Is(err, errFaltaArchivo) {
			return httpapi.SubirMultimedia400JSONResponse{Message: err.Error()}, nil
		}
		return httpapi.SubirMultimedia400JSONResponse{Message: "petición multipart inválida"}, nil
	}
	defer archivo.Close()

	m, err := h.svc.Subir(ctx, request.ReporteId, userID, archivo)
	if err != nil {
		return nil, err
	}

	return httpapi.SubirMultimedia201JSONResponse(toMultimedia(m)), nil
}
