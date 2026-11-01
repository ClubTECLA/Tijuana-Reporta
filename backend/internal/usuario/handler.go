package usuario

import (
	"context"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/db/sqlc"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/httpapi"
	openapi_types "github.com/oapi-codegen/runtime/types"
)

// Handler implementa las operaciones de autenticación y de usuarios del
// contrato; el servidor lo embebe junto con los de las demás funcionalidades.
type Handler struct {
	auth *Auth
	svc  *Service
}

func NewHandler(auth *Auth, svc *Service) *Handler {
	return &Handler{auth: auth, svc: svc}
}

// toUsuarioResumen converts a stored user summary to the API representation,
// leaving the email nil (serialized as null) when the user has none.
func toUsuarioResumen(u sqlc.ListAllUsersRow) httpapi.UsuarioResumen {
	var email *openapi_types.Email
	if u.Email != nil {
		e := openapi_types.Email(*u.Email)
		email = &e
	}

	return httpapi.UsuarioResumen{
		Username:      u.Username,
		Email:         email,
		RolName:       u.RolName,
		ReportesCount: u.ReportesCount,
	}
}

// ListarUsuarios returns a 200 response containing user summaries, using an
// empty array when the service returns no users. Service errors are propagated
// unchanged with a nil response.
func (h *Handler) ListarUsuarios(ctx context.Context, request httpapi.ListarUsuariosRequestObject) (httpapi.ListarUsuariosResponseObject, error) {
	usuarios, err := h.svc.ListarUsuarios(ctx)
	if err != nil {
		return nil, err
	}

	usuarioResumenes := make([]httpapi.UsuarioResumen, len(usuarios))
	for i, u := range usuarios {
		usuarioResumenes[i] = toUsuarioResumen(u)
	}
	return httpapi.ListarUsuarios200JSONResponse(usuarioResumenes), nil
}
