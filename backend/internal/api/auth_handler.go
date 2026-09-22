package api

import (
	"context"
	"errors"
	"time"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/domain"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/middleware"
	openapi_types "github.com/oapi-codegen/runtime/types"
)

func (s *Server) Register(ctx context.Context, request RegisterRequestObject) (RegisterResponseObject, error) {
	user, token, ttl, err := s.services.Auth.Register(ctx, string(request.Body.Email), request.Body.Username, request.Body.Password)
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
