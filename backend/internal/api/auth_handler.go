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

// maxBcryptPasswordBytes es el límite de bcrypt: trunca (y en implementaciones
// más nuevas devuelve error) cualquier byte después del 72, así que un
// password más largo debe rechazarse antes de llegar a bcrypt.
const maxBcryptPasswordBytes = 72

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

	return Me200JSONResponse(toUsuario(user)), nil
}

func toAuthResponse(user domain.Users, token string, ttl time.Duration) AuthResponse {
	return AuthResponse{
		AccessToken: token,
		TokenType:   "Bearer",
		ExpiresIn:   int(ttl.Seconds()),
		User:        toUsuario(user),
	}
}

func toUsuario(user domain.Users) Usuario {
	var email openapi_types.Email
	if user.Email != nil {
		email = openapi_types.Email(*user.Email)
	}

	return Usuario{
		Id:        user.ID,
		Email:     email,
		Username:  user.UserName,
		RolId:     user.RolID,
		CreatedAt: user.CreatedAt,
	}
}
