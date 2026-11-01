package api

import (
	"context"
	"errors"
	"io"
	"mime/multipart"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/domain"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/httperr"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/middleware"
)

// campoArchivo es el campo del multipart que lleva el archivo.
const campoArchivo = "file"

var errFaltaArchivo = errors.New("falta el campo file")

func toMultimedia(m domain.Multimedia) Multimedia {
	return Multimedia{CreatedAt: m.CreatedAt, Id: m.ID, Path: m.Path, UserId: m.UserID}
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
func (s *Server) SubirMultimedia(ctx context.Context, request SubirMultimediaRequestObject) (SubirMultimediaResponseObject, error) {
	userID, ok := middleware.UserIDFromContext(ctx)
	if !ok {
		return nil, httperr.ErrNoAutenticado
	}

	archivo, err := archivoDelMultipart(request.Body)
	if err != nil {
		if errors.Is(err, errFaltaArchivo) {
			return SubirMultimedia400JSONResponse{Message: err.Error()}, nil
		}
		return SubirMultimedia400JSONResponse{Message: "petición multipart inválida"}, nil
	}
	defer archivo.Close()

	m, err := s.services.Multimedia.Subir(ctx, request.ReporteId, userID, archivo)
	if err != nil {
		return nil, err
	}

	return SubirMultimedia201JSONResponse(toMultimedia(m)), nil
}
