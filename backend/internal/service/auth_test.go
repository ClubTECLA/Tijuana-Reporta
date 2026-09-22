package service

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/domain"
	"github.com/google/uuid"
)

type fakeUserRepo struct {
	byEmail map[string]domain.Users
}

func (f *fakeUserRepo) Create(_ context.Context, email, username, hash string, rolID int) (domain.Users, error) {
	if _, exists := f.byEmail[email]; exists {
		return domain.Users{}, domain.ErrEmailTaken
	}
	u := domain.Users{ID: uuid.New(), Email: &email, UserName: username, RolID: rolID, PasswordHash: &hash, CreatedAt: time.Now()}
	f.byEmail[email] = u
	return u, nil
}

func (f *fakeUserRepo) GetByEmail(_ context.Context, email string) (domain.Users, error) {
	if u, ok := f.byEmail[email]; ok {
		return u, nil
	}
	return domain.Users{}, domain.ErrUserNotFound
}

func (f *fakeUserRepo) GetByID(_ context.Context, id uuid.UUID) (domain.Users, error) {
	for _, u := range f.byEmail {
		if u.ID == id {
			return u, nil
		}
	}
	return domain.Users{}, domain.ErrUserNotFound
}

func TestAuthService_RegisterAndLogin(t *testing.T) {
	repo := &fakeUserRepo{byEmail: map[string]domain.Users{}}
	svc := NewAuthService(repo, []byte("test-secret-at-least-32-bytes!!"), time.Hour)
	ctx := context.Background()

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

	if _, _, _, err := svc.Login(ctx, "test@example.com", "wrong-password"); !errors.Is(err, domain.ErrInvalidCredentials) {
		t.Fatalf("Login() with wrong password error = %v, want ErrInvalidCredentials", err)
	}
	if _, _, _, err := svc.Login(ctx, "nobody@example.com", "whatever"); !errors.Is(err, domain.ErrInvalidCredentials) {
		t.Fatalf("Login() with unknown email error = %v, want ErrInvalidCredentials", err)
	}
	if _, token, _, err := svc.Login(ctx, "test@example.com", "s3cretpw"); err != nil || token == "" {
		t.Fatalf("Login() with correct credentials error = %v, token = %q", err, token)
	}
}
