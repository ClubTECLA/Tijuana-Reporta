package domain

import "testing"

func TestTituloReporte(t *testing.T) {
	direccion := "Calle Flores Magón 8267 · Zona Centro"
	if got, want := TituloReporte("Socavón", &direccion), "Socavón en Calle Flores Magón 8267 · Zona Centro"; got != want {
		t.Errorf("TituloReporte() = %q, want %q", got, want)
	}
	if got := TituloReporte("Socavón", nil); got != "Socavón" {
		t.Errorf("TituloReporte() sin dirección = %q, want %q", got, "Socavón")
	}
}
