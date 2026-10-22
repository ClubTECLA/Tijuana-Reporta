package config

import "testing"

// limpiarEntorno deja sin valor todas las variables de configuración.
func limpiarEntorno(t *testing.T) {
	t.Helper()
	for _, v := range []string{"MULTIMEDIA_PORT", "UPLOADS_DIR", "MAX_ARCHIVO_BYTES"} {
		t.Setenv(v, "")
	}
}

func TestLoad_Defaults(t *testing.T) {
	limpiarEntorno(t)

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load() error = %v, want nil", err)
	}
	if cfg.Port != "8081" {
		t.Errorf("Port = %q, want %q", cfg.Port, "8081")
	}
	if cfg.UploadsDir != defaultUploadsDir {
		t.Errorf("UploadsDir = %q, want %q", cfg.UploadsDir, defaultUploadsDir)
	}
	if cfg.MaxArchivoBytes != defaultMaxArchivoBytes {
		t.Errorf("MaxArchivoBytes = %d, want %d", cfg.MaxArchivoBytes, defaultMaxArchivoBytes)
	}
}

func TestLoad_ValoresDelEntorno(t *testing.T) {
	limpiarEntorno(t)
	t.Setenv("MULTIMEDIA_PORT", "9000")
	t.Setenv("UPLOADS_DIR", "/data/uploads")
	t.Setenv("MAX_ARCHIVO_BYTES", "500000")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load() error = %v, want nil", err)
	}
	if cfg.Port != "9000" {
		t.Errorf("Port = %q, want %q", cfg.Port, "9000")
	}
	if cfg.UploadsDir != "/data/uploads" {
		t.Errorf("UploadsDir = %q, want %q", cfg.UploadsDir, "/data/uploads")
	}
	if cfg.MaxArchivoBytes != 500000 {
		t.Errorf("MaxArchivoBytes = %d, want %d", cfg.MaxArchivoBytes, 500000)
	}
}

func TestLoad_LimiteInvalido(t *testing.T) {
	valores := []struct {
		name  string
		valor string
	}{
		{name: "no numérico", valor: "abc"},
		{name: "cero", valor: "0"},
		{name: "negativo", valor: "-5"},
	}

	for _, v := range valores {
		t.Run(v.name, func(t *testing.T) {
			limpiarEntorno(t)
			t.Setenv("MAX_ARCHIVO_BYTES", v.valor)

			if _, err := Load(); err == nil {
				t.Errorf("Load() con MAX_ARCHIVO_BYTES=%q = nil, want error", v.valor)
			}
		})
	}
}
