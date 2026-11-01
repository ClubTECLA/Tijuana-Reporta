package usuario

import (
	"context"
	"time"
	"unicode/utf8"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/db/sqlc"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/httpapi"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/httperr"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/middleware"
	openapi_types "github.com/oapi-codegen/runtime/types"
)

// maxBcryptPasswordBytes es el límite de bcrypt: cualquier byte después del 72,
// así que una contraseña más larga debe rechazarse antes de llegar a bcrypt.
const maxBcryptPasswordBytes = 72

// Register crea un usuario con password local y devuelve un token de acceso
func (h *Handler) Register(ctx context.Context, request httpapi.RegisterRequestObject) (httpapi.RegisterResponseObject, error) {
	username := request.Body.Username
	password := request.Body.Password

	if username == "" || password == "" {
		return httpapi.Register400JSONResponse{Message: "username y password son requeridos"}, nil
	}
	if utf8.RuneCountInString(username) > 100 {
		return httpapi.Register400JSONResponse{Message: "username debe tener entre 1 y 100 caracteres"}, nil
	}
	if len(password) < 8 || len(password) > maxBcryptPasswordBytes {
		return httpapi.Register400JSONResponse{Message: "password debe tener entre 8 y 72 bytes"}, nil
	}

	user, token, ttl, err := h.auth.Register(ctx, string(request.Body.Email), username, password)
	if err != nil {
		return nil, err
	}

	return httpapi.Register201JSONResponse(toAuthResponse(user, token, ttl)), nil
}

// Login valida el email y password, y devuelve un token de acceso firmado.
func (h *Handler) Login(ctx context.Context, request httpapi.LoginRequestObject) (httpapi.LoginResponseObject, error) {
	user, token, ttl, err := h.auth.Login(ctx, string(request.Body.Email), request.Body.Password)
	if err != nil {
		return nil, err
	}

	return httpapi.Login200JSONResponse(toAuthResponse(user, token, ttl)), nil
}

// Retorna el usuario autenticado según el token de la cabecera Authorization.
func (h *Handler) Me(ctx context.Context, request httpapi.MeRequestObject) (httpapi.MeResponseObject, error) {
	userID, ok := middleware.UserIDFromContext(ctx)
	if !ok {
		return nil, httperr.ErrNoAutenticado
	}

	user, err := h.auth.GetUser(ctx, userID)
	if err != nil {
		return nil, err
	}

	return httpapi.Me200JSONResponse(toUsuarioMeResponse(user)), nil
}

// Logout cierra la sesión. El token no se guarda en el servidor, así que solo responde 204.
func (h *Handler) Logout(ctx context.Context, request httpapi.LogoutRequestObject) (httpapi.LogoutResponseObject, error) {
	return httpapi.Logout204Response{}, nil
}

// toAuthResponse convierte un sqlc.User y un token en la respuesta de login/register.
func toAuthResponse(user sqlc.User, token string, ttl time.Duration) httpapi.AuthResponse {
	return httpapi.AuthResponse{
		AccessToken: token,
		TokenType:   "Bearer",
		ExpiresIn:   int(ttl.Seconds()),
		User:        toUsuario(user),
	}
}

// toUsuario convierte un sqlc.User en el Usuario que anida AuthResponse.
func toUsuario(user sqlc.User) httpapi.Usuario {
	var email openapi_types.Email
	if user.Email != nil {
		email = openapi_types.Email(*user.Email)
	}

	return httpapi.Usuario{
		Id:        user.ID,
		Email:     email,
		Username:  user.Username,
		RolId:     user.RolID,
		CreatedAt: user.CreatedAt,
	}
}

// toUsuarioMeResponse convierte un ConRol en la respuesta de
// /auth/me, que expone el nombre del rol en vez de su id.
func toUsuarioMeResponse(user ConRol) httpapi.UsuarioMeResponse {
	var email openapi_types.Email
	if user.Email != nil {
		email = openapi_types.Email(*user.Email)
	}

	return httpapi.UsuarioMeResponse{
		Id:       user.ID,
		Email:    email,
		Username: user.Username,
		RolName:  user.RolName,
	}
}
