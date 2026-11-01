package reporte

import (
	"errors"
	"testing"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/db/sqlc"
)

func TestTitulo(t *testing.T) {
	direccion := "Calle Flores Magón 8267 · Zona Centro"
	if got, want := Titulo("Socavón", &direccion), "Socavón en Calle Flores Magón 8267 · Zona Centro"; got != want {
		t.Errorf("Titulo() = %q, want %q", got, want)
	}
	if got := Titulo("Socavón", nil); got != "Socavón" {
		t.Errorf("Titulo() sin dirección = %q, want %q", got, "Socavón")
	}
}

func TestValidarTransicion(t *testing.T) {
	estados := []sqlc.Estado{sqlc.EstadoPendiente, sqlc.EstadoProbable, sqlc.EstadoVerificado, sqlc.EstadoResuelto, sqlc.EstadoDescartado}
	// permitidas es la tabla completa: cualquier par que no esté aquí,
	// incluido quedarse en el mismo estado, es inválido.
	permitidas := map[[2]sqlc.Estado]bool{
		{sqlc.EstadoPendiente, sqlc.EstadoProbable}:    true,
		{sqlc.EstadoPendiente, sqlc.EstadoVerificado}:  true,
		{sqlc.EstadoPendiente, sqlc.EstadoResuelto}:    true,
		{sqlc.EstadoPendiente, sqlc.EstadoDescartado}:  true,
		{sqlc.EstadoProbable, sqlc.EstadoVerificado}:   true,
		{sqlc.EstadoProbable, sqlc.EstadoResuelto}:     true,
		{sqlc.EstadoProbable, sqlc.EstadoDescartado}:   true,
		{sqlc.EstadoVerificado, sqlc.EstadoResuelto}:   true,
		{sqlc.EstadoVerificado, sqlc.EstadoDescartado}: true,
	}
	for _, de := range estados {
		for _, a := range estados {
			t.Run(string(de)+"→"+string(a), func(t *testing.T) {
				var want error
				if !permitidas[[2]sqlc.Estado{de, a}] {
					want = ErrTransicionInvalida
				}
				if err := ValidarTransicion(de, a); !errors.Is(err, want) {
					t.Errorf("ValidarTransicion(%q, %q) = %v, want %v", de, a, err, want)
				}
			})
		}
	}
}

func TestValidarTransicion_EstadoFueraDelEnum(t *testing.T) {
	if err := ValidarTransicion(sqlc.EstadoPendiente, "Arreglado"); !errors.Is(err, ErrTransicionInvalida) {
		t.Errorf("ValidarTransicion(Pendiente, Arreglado) = %v, want %v", err, ErrTransicionInvalida)
	}
	if EstadoValido("Arreglado") || !EstadoValido(sqlc.EstadoDescartado) {
		t.Error("EstadoValido() no distingue los valores del enum")
	}
}

func TestPuedeGestionar(t *testing.T) {
	tests := []struct {
		rol  string
		want bool
	}{
		{"", false},
		{RolCiudadano, false},
		{"admin", true},
		{"rescatista", true},
		// Un rol que no existe en el baseline también puede: solo se excluye ciudadano.
		{"rol_nuevo", true},
	}
	for _, tt := range tests {
		if got := PuedeGestionar(tt.rol); got != tt.want {
			t.Errorf("PuedeGestionar(%q) = %v, want %v", tt.rol, got, tt.want)
		}
	}
}
