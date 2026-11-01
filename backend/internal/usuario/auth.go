package usuario

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/db"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/db/sqlc"
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

// authStore es lo que Auth necesita de Store; los tests lo cumplen con un
// falso en memoria.
type authStore interface {
	CreateUserWithLocalProvider(ctx context.Context, arg sqlc.CreateUserParams) (sqlc.User, error)
	GetUserByEmail(ctx context.Context, email *string) (sqlc.User, error)
	GetUserByID(ctx context.Context, id uuid.UUID) (sqlc.User, error)
	GetDefaultRole(ctx context.Context) (sqlc.Role, error)
	GetUserWithRolByID(ctx context.Context, id uuid.UUID) (sqlc.GetUserWithRolByIDRow, error)
}

type Auth struct {
	store           authStore
	secret          []byte
	ttl             time.Duration
	defaultRoleID   int
	defaultRoleName string
}

// NewAuth resuelve el id del rol "ciudadano" contra la base una sola
// vez, en vez de asumir un id fijo.
func NewAuth(ctx context.Context, store authStore, secret []byte, ttl time.Duration) (*Auth, error) {
	defaultRole, err := store.GetDefaultRole(ctx)
	if err != nil {
		return nil, fmt.Errorf("resolving default role: %w", err)
	}
	return &Auth{store: store, secret: secret, ttl: ttl, defaultRoleID: defaultRole.ID, defaultRoleName: defaultRole.Nombre}, nil
}

// Register crea el usuario con password local y devuelve el token de acceso
// ya firmado, junto con su tiempo de vida.
func (s *Auth) Register(ctx context.Context, email, username, password string) (sqlc.User, string, time.Duration, error) {
	email = normalizeEmail(email)

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return sqlc.User{}, "", 0, err
	}
	hashed := string(hash)

	user, err := s.store.CreateUserWithLocalProvider(ctx, sqlc.CreateUserParams{
		Email:        &email,
		Username:     username,
		RolID:        s.defaultRoleID,
		PasswordHash: &hashed,
	})
	if err != nil {
		if db.IsUniqueViolation(err) {
			return sqlc.User{}, "", 0, ErrEmailTaken
		}
		return sqlc.User{}, "", 0, err
	}

	token, err := s.issueToken(user, s.defaultRoleName)
	if err != nil {
		return sqlc.User{}, "", 0, err
	}
	return user, token, s.ttl, nil
}

// Login valida el password contra el hash guardado. Si el email no existe o
// el usuario no tiene password local, compara igual contra un hash dummy
// para no revelar cuál de los dos casos sucedió.
func (s *Auth) Login(ctx context.Context, email, password string) (sqlc.User, string, time.Duration, error) {
	email = normalizeEmail(email)

	user, err := s.store.GetUserByEmail(ctx, &email)
	notFound := db.IsNotFound(err)
	if err != nil && !notFound {
		return sqlc.User{}, "", 0, err
	}

	hash := dummyPasswordHash
	if user.PasswordHash != nil {
		hash = *user.PasswordHash
	}

	if bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)) != nil {
		return sqlc.User{}, "", 0, ErrInvalidCredentials
	}
	if notFound {
		return sqlc.User{}, "", 0, ErrInvalidCredentials
	}

	row, err := s.store.GetUserWithRolByID(ctx, user.ID)
	if err != nil {
		return sqlc.User{}, "", 0, err
	}

	token, err := s.issueToken(user, row.RolName)
	if err != nil {
		return sqlc.User{}, "", 0, err
	}
	return user, token, s.ttl, nil
}

// GetUser devuelve el usuario con su rol según el id.
func (s *Auth) GetUser(ctx context.Context, id uuid.UUID) (ConRol, error) {
	row, err := s.store.GetUserWithRolByID(ctx, id)
	if err != nil {
		if db.IsNotFound(err) {
			return ConRol{}, ErrUserNotFound
		}
		return ConRol{}, err
	}

	return ConRol{
		ID:       row.ID,
		Email:    row.Email,
		Username: row.Username,
		RolName:  row.RolName,
	}, nil
}

// tokenClaims son los claims del access token. middleware.Auth lee "sub" y
// "rol"; si cambias un nombre aquí, cámbialo allá también.
type tokenClaims struct {
	Rol string `json:"rol"`
	jwt.RegisteredClaims
}

// issueToken genera un JWT firmado con el id del usuario, su rol y la fecha
// de expiración.
func (s *Auth) issueToken(user sqlc.User, rol string) (string, error) {
	now := time.Now()
	claims := tokenClaims{
		Rol: rol,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   user.ID.String(),
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(s.ttl)),
		},
	}
	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString(s.secret)
}

// normalizeEmail convierte el email a minúsculas y le quita espacios al inicio y al final.
func normalizeEmail(email string) string {
	return strings.ToLower(strings.TrimSpace(email))
}
