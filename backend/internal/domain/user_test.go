package domain

import "testing"

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
