package config

import "testing"

// limpiarEntorno deja sin valor todas las variables de configuración.
func limpiarEntorno(t *testing.T) {
	t.Helper()
	for _, v := range []string{"MULTIMEDIA_PORT", "UPLOADS_DIR", "CUARENTENA_DIR", "MAX_ARCHIVO_BYTES", "MAX_FOTO_BYTES", "MAX_VIDEO_BYTES"} {
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
	if cfg.CuarentenaDir != defaultCuarentenaDir {
		t.Errorf("CuarentenaDir = %q, want %q", cfg.CuarentenaDir, defaultCuarentenaDir)
	}
	if cfg.MaxArchivoBytes != defaultMaxArchivoBytes {
		t.Errorf("MaxArchivoBytes = %d, want %d", cfg.MaxArchivoBytes, defaultMaxArchivoBytes)
	}
	if cfg.MaxFotoBytes != defaultMaxFotoBytes {
		t.Errorf("MaxFotoBytes = %d, want %d", cfg.MaxFotoBytes, defaultMaxFotoBytes)
	}
	if cfg.MaxVideoBytes != defaultMaxVideoBytes {
		t.Errorf("MaxVideoBytes = %d, want %d", cfg.MaxVideoBytes, defaultMaxVideoBytes)
	}
}

func TestLoad_ValoresDelEntorno(t *testing.T) {
	limpiarEntorno(t)
	t.Setenv("MULTIMEDIA_PORT", "9000")
	t.Setenv("UPLOADS_DIR", "/data/uploads")
	t.Setenv("CUARENTENA_DIR", "/data/cuarentena")
	t.Setenv("MAX_ARCHIVO_BYTES", "500000")
	t.Setenv("MAX_FOTO_BYTES", "100000")
	t.Setenv("MAX_VIDEO_BYTES", "200000")

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
	if cfg.CuarentenaDir != "/data/cuarentena" {
		t.Errorf("CuarentenaDir = %q, want %q", cfg.CuarentenaDir, "/data/cuarentena")
	}
	if cfg.MaxArchivoBytes != 500000 {
		t.Errorf("MaxArchivoBytes = %d, want %d", cfg.MaxArchivoBytes, 500000)
	}
	if cfg.MaxFotoBytes != 100000 {
		t.Errorf("MaxFotoBytes = %d, want %d", cfg.MaxFotoBytes, 100000)
	}
	if cfg.MaxVideoBytes != 200000 {
		t.Errorf("MaxVideoBytes = %d, want %d", cfg.MaxVideoBytes, 200000)
	}
}

func TestLoad_LimiteInvalido(t *testing.T) {
	variables := []string{"MAX_ARCHIVO_BYTES", "MAX_FOTO_BYTES", "MAX_VIDEO_BYTES"}
	valores := []struct {
		name  string
		valor string
	}{
		{name: "no numérico", valor: "abc"},
		{name: "cero", valor: "0"},
		{name: "negativo", valor: "-5"},
	}

	for _, variable := range variables {
		for _, v := range valores {
			t.Run(variable+"/"+v.name, func(t *testing.T) {
				limpiarEntorno(t)
				t.Setenv(variable, v.valor)

				if _, err := Load(); err == nil {
					t.Errorf("Load() con %s=%q = nil, want error", variable, v.valor)
				}
			})
		}
	}
}
