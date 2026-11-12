package centro

import (
	"context"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/db/sqlc"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/httpapi"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/httperr"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/middleware"
)

type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

func toTiposCentro(d sqlc.TiposCentro) httpapi.TiposCentro {
	return httpapi.TiposCentro{
		Id:     d.ID,
		Nombre: d.Nombre,
	}
}

func toNuevoTipoCentro(b *httpapi.CrearTipoCentroRequest) NuevoTipoCentro {
	nuevo := NuevoTipoCentro{
		Nombre: b.Nombre,
	}
	return nuevo
}

func (h *Handler) ListarTiposCentro(ctx context.Context, request httpapi.ListarTiposCentroRequestObject) (httpapi.ListarTiposCentroResponseObject, error) {
	detalles, err := h.svc.ListarTiposCentro(ctx)
	if err != nil {
		return nil, err
	}

	out := make(httpapi.ListarTiposCentro200JSONResponse, 0, len(detalles))
	for _, d := range detalles {
		out = append(out, toTiposCentro(d))
	}
	return out, nil
}

func (h *Handler) ObtenerTipoCentro(ctx context.Context, request httpapi.ObtenerTipoCentroRequestObject) (httpapi.ObtenerTipoCentroResponseObject, error) {
	d, err := h.svc.ObtenerTipoCentro(ctx, request.TipoCentroId)
	if err != nil {
		return nil, err
	}

	return httpapi.ObtenerTipoCentro200JSONResponse(toTiposCentro(d)), nil
}

func (h *Handler) CrearTipoCentro(ctx context.Context, request httpapi.CrearTipoCentroRequestObject) (httpapi.CrearTipoCentroResponseObject, error) {
	userID, ok := middleware.UserIDFromContext(ctx)
	if !ok {
		return nil, httperr.ErrNoAutenticado
	}

	t, err := h.svc.CrearTipoCentro(ctx, toNuevoTipoCentro(request.Body), userID)
	if err != nil {
		return nil, err
	}

	return httpapi.CrearTipoCentro201JSONResponse(toTiposCentro(t)), nil
}
