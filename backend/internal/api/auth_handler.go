package api

import (
	"context"
	"errors"
	"time"
	"unicode/utf8"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/domain"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/middleware"
	openapi_types "github.com/oapi-codegen/runtime/types"
)

// maxBcryptPasswordBytes es el límite de bcrypt: cualquier byte después del 72,
// así que una contraseña más larga debe rechazarse antes de llegar a bcrypt.
const maxBcryptPasswordBytes = 72

// Register crea un usuario con password local y devuelve un token de acceso
func (s *Server) Register(ctx context.Context, request RegisterRequestObject) (RegisterResponseObject, error) {
	username := request.Body.Username
	password := request.Body.Password

	if username == "" || password == "" {
		return Register400JSONResponse{Message: "username y password son requeridos"}, nil
	}
	if utf8.RuneCountInString(username) > 100 {
		return Register400JSONResponse{Message: "username debe tener entre 1 y 100 caracteres"}, nil
	}
	if len(password) < 8 || len(password) > maxBcryptPasswordBytes {
		return Register400JSONResponse{Message: "password debe tener entre 8 y 72 bytes"}, nil
	}

	user, token, ttl, err := s.services.Auth.Register(ctx, string(request.Body.Email), username, password)
	if err != nil {
		if errors.Is(err, domain.ErrEmailTaken) {
			return Register409JSONResponse{Message: "el email ya está registrado"}, nil
		}
		return nil, err
	}

	return Register201JSONResponse(toAuthResponse(user, token, ttl)), nil
}

// Login valida el email y password, y devuelve un token de acceso firmado.
func (s *Server) Login(ctx context.Context, request LoginRequestObject) (LoginResponseObject, error) {
	user, token, ttl, err := s.services.Auth.Login(ctx, string(request.Body.Email), request.Body.Password)
	if err != nil {
		if errors.Is(err, domain.ErrInvalidCredentials) {
			return Login401JSONResponse{Message: "invalid credentials"}, nil
		}
		return nil, err
	}

	return Login200JSONResponse(toAuthResponse(user, token, ttl)), nil
}

// Retorna el usuario autenticado según el token de la cabecera Authorization.
func (s *Server) Me(ctx context.Context, request MeRequestObject) (MeResponseObject, error) {
	userID, ok := middleware.UserIDFromContext(ctx)
	if !ok {
		return nil, errors.New("userID not found in context")
	}

	user, err := s.services.Auth.GetUser(ctx, userID)
	if err != nil {
		if errors.Is(err, domain.ErrUserNotFound) {
			return Me401JSONResponse{Message: "no autenticado"}, nil
		}
		return nil, err
	}

	return Me200JSONResponse(toUsuarioMeResponse(user)), nil
}

// toAuthResponse convierte un domain.User y un token en la respuesta de login/register.
func toAuthResponse(user domain.User, token string, ttl time.Duration) AuthResponse {
	return AuthResponse{
		AccessToken: token,
		TokenType:   "Bearer",
		ExpiresIn:   int(ttl.Seconds()),
		User:        toUsuario(user),
	}
}

// toUsuario convierte un domain.User en el Usuario que anida AuthResponse.
func toUsuario(user domain.User) Usuario {
	var email openapi_types.Email
	if user.Email != nil {
		email = openapi_types.Email(*user.Email)
	}

	return Usuario{
		Id:        user.ID,
		Email:     email,
		Username:  user.Username,
		RolId:     user.RolID,
		CreatedAt: user.CreatedAt,
	}
}

// toUsuarioMeResponse convierte un domain.UserWithRol en la respuesta de
// /auth/me, que expone el nombre del rol en vez de su id.
func toUsuarioMeResponse(user domain.UserWithRol) UsuarioMeResponse {
	var email openapi_types.Email
	if user.Email != nil {
		email = openapi_types.Email(*user.Email)
	}

	return UsuarioMeResponse{
		Id:       user.ID,
		Email:    email,
		Username: user.Username,
		RolName:  user.RolName,
	}
}
