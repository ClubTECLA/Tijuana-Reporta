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

func toCentro(c Centro) httpapi.Centro {
	return httpapi.Centro{
		Activo:      c.Activo,
		Cantidad:    c.Cantidad,
		Capacidad:   c.Capacidad,
		CreatedAt:   c.CreatedAt,
		Descripcion: c.Descripcion,
		Id:          c.ID,
		ImagePath:   c.ImagePath,
		Latitude:    c.Latitude,
		Longitude:   c.Longitude,
		Nombre:      c.Nombre,
	}
}

func toNuevoCentro(b *httpapi.CrearCentroRequest) NuevoCentro {
	return NuevoCentro{
		TipoCentro:  b.TipoCentro,
		Nombre:      b.Nombre,
		Descripcion: b.Descripcion,
		Latitude:    b.Latitude,
		Longitude:   float64(b.Longitude),
		Capacidad:   b.Capacidad,
		Cantidad:    b.Cantidad,
		Activo:      b.Activo,
	}
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

func (h *Handler) CrearCentro(ctx context.Context, request httpapi.CrearCentroRequestObject) (httpapi.CrearCentroResponseObject, error) {
	userID, ok := middleware.UserIDFromContext(ctx)
	if !ok {
		return nil, httperr.ErrNoAutenticado
	}
	c, err := h.svc.CrearCentro(ctx, toNuevoCentro(request.Body), userID)
	if err != nil {
		return nil, err
	}
	return httpapi.CrearCentro201JSONResponse(toCentro(c)), nil
}

func (h *Handler) ObtenerCentro(ctx context.Context, request httpapi.ObtenerCentroRequestObject) (httpapi.ObtenerCentroResponseObject, error) {
	c, err := h.svc.ObtenerCentro(ctx, request.CentroId)
	if err != nil {
		return nil, err
	}
	return httpapi.ObtenerCentro200JSONResponse(toCentro(c)), nil
}

func (h *Handler) ListarCentros(ctx context.Context, request httpapi.ListarCentrosRequestObject) (httpapi.ListarCentrosResponseObject, error) {
	incluir := request.Params.IncluirInactivos != nil && *request.Params.IncluirInactivos
	centros, err := h.svc.ListarCentros(ctx, incluir)
	if err != nil {
		return nil, err
	}
	out := make(httpapi.ListarCentros200JSONResponse, 0, len(centros))
	for _, c := range centros {
		out = append(out, toCentro(c))
	}
	return out, nil
}
