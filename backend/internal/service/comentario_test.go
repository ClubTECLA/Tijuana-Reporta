package service

import (
	"context"
	"testing"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/domain"
	"github.com/google/uuid"
)

type fakeComentarioRepo struct{}

func (f *fakeComentarioRepo) Crear(_ context.Context, reporteID, userID uuid.UUID, texto string) (domain.Comentario, error) {
	return domain.Comentario{ReporteID: reporteID, UserID: userID, Comentario: texto}, nil
}

func TestComentarioService_Crear(t *testing.T) {
	svc := NewComentarioService(&fakeComentarioRepo{})
	reporteID, userID := uuid.New(), uuid.New()

	c, err := svc.Crear(context.Background(), reporteID, userID, "todo bien")
	if err != nil {
		t.Fatalf("Crear() error = %v", err)
	}
	if c.ReporteID != reporteID || c.UserID != userID || c.Comentario != "todo bien" {
		t.Fatalf("Crear() = %+v, want reporteID=%v userID=%v comentario=%q", c, reporteID, userID, "todo bien")
	}
}
