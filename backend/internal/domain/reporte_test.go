package domain

import (
	"errors"
	"testing"
)

func TestTituloReporte(t *testing.T) {
	direccion := "Calle Flores Magón 8267 · Zona Centro"
	if got, want := TituloReporte("Socavón", &direccion), "Socavón en Calle Flores Magón 8267 · Zona Centro"; got != want {
		t.Errorf("TituloReporte() = %q, want %q", got, want)
	}
	if got := TituloReporte("Socavón", nil); got != "Socavón" {
		t.Errorf("TituloReporte() sin dirección = %q, want %q", got, "Socavón")
	}
}

func TestValidarTransicion(t *testing.T) {
	estados := []Estado{EstadoPendiente, EstadoProbable, EstadoVerificado, EstadoResuelto, EstadoDescartado}
	// permitidas es la tabla completa: cualquier par que no esté aquí,
	// incluido quedarse en el mismo estado, es inválido.
	permitidas := map[[2]Estado]bool{
		{EstadoPendiente, EstadoProbable}:    true,
		{EstadoPendiente, EstadoVerificado}:  true,
		{EstadoPendiente, EstadoResuelto}:    true,
		{EstadoPendiente, EstadoDescartado}:  true,
		{EstadoProbable, EstadoVerificado}:   true,
		{EstadoProbable, EstadoResuelto}:     true,
		{EstadoProbable, EstadoDescartado}:   true,
		{EstadoVerificado, EstadoResuelto}:   true,
		{EstadoVerificado, EstadoDescartado}: true,
	}
	for _, de := range estados {
		for _, a := range estados {
			t.Run(string(de)+"→"+string(a), func(t *testing.T) {
				var want error
				if !permitidas[[2]Estado{de, a}] {
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
	if err := ValidarTransicion(EstadoPendiente, "Arreglado"); !errors.Is(err, ErrTransicionInvalida) {
		t.Errorf("ValidarTransicion(Pendiente, Arreglado) = %v, want %v", err, ErrTransicionInvalida)
	}
	if EstadoValido("Arreglado") || !EstadoValido(EstadoDescartado) {
		t.Error("EstadoValido() no distingue los valores del enum")
	}
}
