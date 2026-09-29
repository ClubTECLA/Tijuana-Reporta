package service

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/domain"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
)

// errUniqueViolation imita lo que devuelve Postgres al romper el UNIQUE de
// users.email, para ejercer la traducción a domain.ErrEmailTaken.
var errUniqueViolation = &pgconn.PgError{Code: "23505", ConstraintName: "users_email_key"}

// fakeAuthStore implementa AuthStore en memoria.
type fakeAuthStore struct {
	byEmail       map[string]domain.User
	defaultRoleID int
}

func (f *fakeAuthStore) CreateUserWithLocalProvider(_ context.Context, arg domain.CreateUserParams) (domain.User, error) {
	email := ""
	if arg.Email != nil {
		email = *arg.Email
	}
	if _, exists := f.byEmail[email]; exists {
		return domain.User{}, errUniqueViolation
	}
	u := domain.User{
		ID:           uuid.New(),
		Email:        arg.Email,
		Username:     arg.Username,
		RolID:        arg.RolID,
		PasswordHash: arg.PasswordHash,
		CreatedAt:    time.Now(),
	}
	f.byEmail[email] = u
	return u, nil
}

func (f *fakeAuthStore) GetUserByEmail(_ context.Context, email *string) (domain.User, error) {
	if email != nil {
		if u, ok := f.byEmail[*email]; ok {
			return u, nil
		}
	}
	return domain.User{}, pgx.ErrNoRows
}

func (f *fakeAuthStore) GetUserByID(_ context.Context, id uuid.UUID) (domain.User, error) {
	for _, u := range f.byEmail {
		if u.ID == id {
			return u, nil
		}
	}
	return domain.User{}, pgx.ErrNoRows
}

func (f *fakeAuthStore) GetUserWithRolByID(_ context.Context, id uuid.UUID) (domain.GetUserWithRolByIDRow, error) {
	for _, u := range f.byEmail {
		if u.ID == id {
			return domain.GetUserWithRolByIDRow{
				ID:       u.ID,
				Email:    u.Email,
				Username: u.Username,
				RolID:    u.RolID,
				RolName:  "ciudadano",
			}, nil
		}
	}
	return domain.GetUserWithRolByIDRow{}, pgx.ErrNoRows
}

func (f *fakeAuthStore) GetDefaultRole(_ context.Context) (domain.Role, error) {
	return domain.Role{ID: f.defaultRoleID, Nombre: "ciudadano"}, nil
}

func TestAuthService_RegisterAndLogin(t *testing.T) {
	store := &fakeAuthStore{byEmail: map[string]domain.User{}, defaultRoleID: 1}
	ctx := context.Background()
	svc, err := NewAuthService(ctx, store, []byte("test-secret-at-least-32-bytes!!"), time.Hour)
	if err != nil {
		t.Fatalf("NewAuthService() error = %v", err)
	}

	user, token, ttl, err := svc.Register(ctx, "  Test@Example.com  ", "tester", "s3cretpw")
	if err != nil {
		t.Fatalf("Register() error = %v", err)
	}
	if token == "" || ttl != time.Hour {
		t.Fatalf("Register() token/ttl = %q/%v, want non-empty token and ttl=1h", token, ttl)
	}
	if user.Email == nil || *user.Email != "test@example.com" {
		t.Fatalf("Register() email = %v, want normalized \"test@example.com\"", user.Email)
	}
	if user.RolID != 1 {
		t.Fatalf("Register() rolID = %d, want 1 (rol por defecto)", user.RolID)
	}

	if _, _, _, err := svc.Register(ctx, "test@example.com", "otro", "s3cretpw"); !errors.Is(err, domain.ErrEmailTaken) {
		t.Fatalf("Register() with duplicate email error = %v, want ErrEmailTaken", err)
	}

	if _, _, _, err := svc.Login(ctx, "test@example.com", "wrong-password"); !errors.Is(err, domain.ErrInvalidCredentials) {
		t.Fatalf("Login() with wrong password error = %v, want ErrInvalidCredentials", err)
	}
	if _, _, _, err := svc.Login(ctx, "nobody@example.com", "whatever"); !errors.Is(err, domain.ErrInvalidCredentials) {
		t.Fatalf("Login() with unknown email error = %v, want ErrInvalidCredentials", err)
	}
	if _, token, _, err := svc.Login(ctx, "test@example.com", "s3cretpw"); err != nil || token == "" {
		t.Fatalf("Login() with correct credentials error = %v, token = %q", err, token)
	}

	if _, err := svc.GetUser(ctx, uuid.New()); !errors.Is(err, domain.ErrUserNotFound) {
		t.Fatalf("GetUser() with unknown id error = %v, want ErrUserNotFound", err)
	}
}
