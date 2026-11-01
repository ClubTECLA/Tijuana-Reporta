package service

import (
	"context"
	"testing"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/db/sqlc"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/domain"
	"github.com/google/uuid"
)

type fakeComentarioStore struct{}

func (f *fakeComentarioStore) CreateComentario(_ context.Context, arg sqlc.CreateComentarioParams) (sqlc.CreateComentarioRow, error) {
	return sqlc.CreateComentarioRow{
		ReporteID:  arg.ReporteID,
		UserID:     arg.UserID,
		Comentario: arg.Comentario,
		Username:   "juan",
		RolName:    domain.RolCiudadano,
	}, nil
}

func TestComentarioService_Crear(t *testing.T) {
	svc := NewComentarioService(&fakeComentarioStore{})
	reporteID, userID := uuid.New(), uuid.New()

	c, err := svc.Crear(context.Background(), reporteID, userID, "todo bien")
	if err != nil {
		t.Fatalf("Crear() error = %v", err)
	}
	if c.ReporteID != reporteID || c.UserID != userID || c.Comentario != "todo bien" {
		t.Fatalf("Crear() = %+v, want reporteID=%v userID=%v comentario=%q", c, reporteID, userID, "todo bien")
	}
	if c.Username != "juan" || c.RolName != domain.RolCiudadano {
		t.Errorf("autor = %q/%q", c.Username, c.RolName)
	}
}
