package api

import (
	"context"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/domain"
	openapi_types "github.com/oapi-codegen/runtime/types"
)

// toUsuarioResumen converts a stored user summary to the API representation,
// using an empty string when the email is nil.
func toUsuarioResumen(u domain.ListAllUsersRow) UsuarioResumen {
	var email openapi_types.Email
	if u.Email != nil {
		email = openapi_types.Email(*u.Email)
	}

	return UsuarioResumen{
		Username:      u.Username,
		Email:         email,
		RolName:       u.RolName,
		ReportesCount: u.ReportesCount,
	}
}

// ListarUsuarios returns a 200 response containing user summaries, using an
// empty array when the service returns no users. Service errors are propagated
// unchanged with a nil response.
func (s *Server) ListarUsuarios(ctx context.Context, request ListarUsuariosRequestObject) (ListarUsuariosResponseObject, error) {
	usuarios, err := s.services.Usuarios.ListarUsuarios(ctx)
	if err != nil {
		return nil, err
	}

	usuarioResumenes := make([]UsuarioResumen, len(usuarios))
	for i, u := range usuarios {
		usuarioResumenes[i] = toUsuarioResumen(u)
	}
	return ListarUsuarios200JSONResponse(usuarioResumenes), nil
}
