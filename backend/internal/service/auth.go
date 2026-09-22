package service

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/domain"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

// dummyPasswordHash se compara contra el password recibido cuando el email
// no existe o el usuario no tiene password local (login con Google, p. ej.).
// Así Login siempre paga el costo de un bcrypt.CompareHashAndPassword,
// evitando que ese email exista o no se filtre por timing o por el mensaje
// de error.
var dummyPasswordHash = func() string {
	hash, err := bcrypt.GenerateFromPassword([]byte("tijuana-reporta-dummy"), bcrypt.DefaultCost)
	if err != nil {
		panic(err)
	}
	return string(hash)
}()

type UserRepository interface {
	Create(ctx context.Context, email, username, hash string, rolID int) (domain.Users, error)
	GetByEmail(ctx context.Context, email string) (domain.Users, error)
	GetByID(ctx context.Context, id uuid.UUID) (domain.Users, error)
}

type AuthService struct {
	repo          UserRepository
	secret        []byte
	ttl           time.Duration
	defaultRoleID int
}

type RolesRepository interface {
	GetDefaultRole(ctx context.Context) (domain.Roles, error)
}

// NewAuthService resuelve el id del rol "ciudadano" contra la base una sola
// vez, en vez de asumir un id fijo: el orden de siembra de 002_seed_roles.sql
// no está garantizado en todos los entornos (p. ej. una base restaurada o
// re-sembrada manualmente).
func NewAuthService(ctx context.Context, repo UserRepository, roles RolesRepository, secret []byte, ttl time.Duration) (*AuthService, error) {
	defaultRole, err := roles.GetDefaultRole(ctx)
	if err != nil {
		return nil, fmt.Errorf("resolving default role: %w", err)
	}
	return &AuthService{repo: repo, secret: secret, ttl: ttl, defaultRoleID: defaultRole.ID}, nil
}

// Register crea el usuario con password local y devuelve el token de acceso
// ya firmado, junto con su tiempo de vida.
func (s *AuthService) Register(ctx context.Context, email, username, password string) (domain.Users, string, time.Duration, error) {
	email = normalizeEmail(email)

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return domain.Users{}, "", 0, err
	}

	user, err := s.repo.Create(ctx, email, username, string(hash), s.defaultRoleID)
	if err != nil {
		return domain.Users{}, "", 0, err
	}

	token, err := s.issueToken(user)
	if err != nil {
		return domain.Users{}, "", 0, err
	}
	return user, token, s.ttl, nil
}

// Login valida el password contra el hash guardado. Si el email no existe o
// el usuario no tiene password local, compara igual contra un hash dummy
// para no revelar cuál de los dos casos ocurrió.
func (s *AuthService) Login(ctx context.Context, email, password string) (domain.Users, string, time.Duration, error) {
	email = normalizeEmail(email)

	user, err := s.repo.GetByEmail(ctx, email)
	if err != nil && !errors.Is(err, domain.ErrUserNotFound) {
		return domain.Users{}, "", 0, err
	}

	hash := dummyPasswordHash
	if user.PasswordHash != nil {
		hash = *user.PasswordHash
	}

	if bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)) != nil {
		return domain.Users{}, "", 0, domain.ErrInvalidCredentials
	}
	if errors.Is(err, domain.ErrUserNotFound) {
		return domain.Users{}, "", 0, domain.ErrInvalidCredentials
	}

	token, err := s.issueToken(user)
	if err != nil {
		return domain.Users{}, "", 0, err
	}
	return user, token, s.ttl, nil
}

func (s *AuthService) GetUser(ctx context.Context, id uuid.UUID) (domain.Users, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *AuthService) issueToken(user domain.Users) (string, error) {
	now := time.Now()
	claims := jwt.RegisteredClaims{
		Subject:   user.ID.String(),
		IssuedAt:  jwt.NewNumericDate(now),
		ExpiresAt: jwt.NewNumericDate(now.Add(s.ttl)),
	}
	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString(s.secret)
}

func normalizeEmail(email string) string {
	return strings.ToLower(strings.TrimSpace(email))
}
