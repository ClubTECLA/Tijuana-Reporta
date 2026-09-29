package service

import (
	"context"
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
var dummyPasswordHash = func() string {
	hash, err := bcrypt.GenerateFromPassword([]byte("tijuana-reporta-dummy"), bcrypt.DefaultCost)
	if err != nil {
		panic(err)
	}
	return string(hash)
}()

// AuthStore es el subconjunto de *database.Store que este servicio usa.
type AuthStore interface {
	CreateUserWithLocalProvider(ctx context.Context, arg domain.CreateUserParams) (domain.User, error)
	GetUserByEmail(ctx context.Context, email *string) (domain.User, error)
	GetUserByID(ctx context.Context, id uuid.UUID) (domain.User, error)
	GetDefaultRole(ctx context.Context) (domain.Role, error)
	GetUserWithRolByID(ctx context.Context, id uuid.UUID) (domain.GetUserWithRolByIDRow, error)
}

type AuthService struct {
	store         AuthStore
	secret        []byte
	ttl           time.Duration
	defaultRoleID int
}

// NewAuthService resuelve el id del rol "ciudadano" contra la base una sola
// vez, en vez de asumir un id fijo.
func NewAuthService(ctx context.Context, store AuthStore, secret []byte, ttl time.Duration) (*AuthService, error) {
	defaultRole, err := store.GetDefaultRole(ctx)
	if err != nil {
		return nil, fmt.Errorf("resolving default role: %w", err)
	}
	return &AuthService{store: store, secret: secret, ttl: ttl, defaultRoleID: defaultRole.ID}, nil
}

// Register crea el usuario con password local y devuelve el token de acceso
// ya firmado, junto con su tiempo de vida.
func (s *AuthService) Register(ctx context.Context, email, username, password string) (domain.User, string, time.Duration, error) {
	email = normalizeEmail(email)

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return domain.User{}, "", 0, err
	}
	hashed := string(hash)

	user, err := s.store.CreateUserWithLocalProvider(ctx, domain.CreateUserParams{
		Email:        &email,
		Username:     username,
		RolID:        s.defaultRoleID,
		PasswordHash: &hashed,
	})
	if err != nil {
		if domain.IsUniqueViolation(err) {
			return domain.User{}, "", 0, domain.ErrEmailTaken
		}
		return domain.User{}, "", 0, err
	}

	token, err := s.issueToken(user)
	if err != nil {
		return domain.User{}, "", 0, err
	}
	return user, token, s.ttl, nil
}

// Login valida el password contra el hash guardado. Si el email no existe o
// el usuario no tiene password local, compara igual contra un hash dummy
// para no revelar cuál de los dos casos sucedió.
func (s *AuthService) Login(ctx context.Context, email, password string) (domain.User, string, time.Duration, error) {
	email = normalizeEmail(email)

	user, err := s.store.GetUserByEmail(ctx, &email)
	notFound := domain.IsNotFound(err)
	if err != nil && !notFound {
		return domain.User{}, "", 0, err
	}

	hash := dummyPasswordHash
	if user.PasswordHash != nil {
		hash = *user.PasswordHash
	}

	if bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)) != nil {
		return domain.User{}, "", 0, domain.ErrInvalidCredentials
	}
	if notFound {
		return domain.User{}, "", 0, domain.ErrInvalidCredentials
	}

	token, err := s.issueToken(user)
	if err != nil {
		return domain.User{}, "", 0, err
	}
	return user, token, s.ttl, nil
}

// GetUser devuelve el usuario con su rol según el id.
func (s *AuthService) GetUser(ctx context.Context, id uuid.UUID) (domain.UserWithRol, error) {
	row, err := s.store.GetUserWithRolByID(ctx, id)
	if err != nil {
		if domain.IsNotFound(err) {
			return domain.UserWithRol{}, domain.ErrUserNotFound
		}
		return domain.UserWithRol{}, err
	}

	return domain.UserWithRol{
		ID:       row.ID,
		Email:    row.Email,
		Username: row.Username,
		RolName:  row.RolName,
	}, nil
}

// issueToken genera un JWT firmado con el id del usuario y la fecha de expiración.
func (s *AuthService) issueToken(user domain.User) (string, error) {
	now := time.Now()
	claims := jwt.RegisteredClaims{
		Subject:   user.ID.String(),
		IssuedAt:  jwt.NewNumericDate(now),
		ExpiresAt: jwt.NewNumericDate(now.Add(s.ttl)),
	}
	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString(s.secret)
}

// normalizeEmail convierte el email a minúsculas y le quita espacios al inicio y al final.
func normalizeEmail(email string) string {
	return strings.ToLower(strings.TrimSpace(email))
}
