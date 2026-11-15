package config

import "testing"

// entornoMinimo define las variables obligatorias y deja sin valor las de multimedia.
func entornoMinimo(t *testing.T) {
	t.Helper()
	t.Setenv("DATABASE_URL", "postgres://u:p@localhost:5432/db")
	t.Setenv("JWT_SECRET", "un-secreto-de-al-menos-32-bytes!!!")
	t.Setenv("MULTIMEDIA_URL", "")
	t.Setenv("MAX_MULTIMEDIA_BYTES", "")
	for _, v := range variablesFoto {
		t.Setenv(v, "")
	}
	for _, v := range variablesMantenimiento {
		t.Setenv(v, "")
	}
}

var variablesMantenimiento = []string{"MANTENIMIENTO_HORA", "MANTENIMIENTO_MAX_ACCIONES", "CUARENTENA_DIAS"}

var variablesFoto = []string{"MAX_FOTO_BYTES", "MAX_FOTO_PIXELES", "MAX_VIDEO_BYTES", "MAX_VIDEO_SEGUNDOS"}

func TestLoad_MultimediaPorDefecto(t *testing.T) {
	entornoMinimo(t)

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load() error = %v, want nil", err)
	}
	if cfg.MultimediaURL != defaultMultimediaURL {
		t.Errorf("MultimediaURL = %q, want %q", cfg.MultimediaURL, defaultMultimediaURL)
	}
	if cfg.MaxMultimediaBytes != defaultMaxMultimediaBytes {
		t.Errorf("MaxMultimediaBytes = %d, want %d", cfg.MaxMultimediaBytes, defaultMaxMultimediaBytes)
	}
}

func TestLoad_MultimediaDelEntorno(t *testing.T) {
	entornoMinimo(t)
	t.Setenv("MULTIMEDIA_URL", "http://multimedia:8081")
	t.Setenv("MAX_MULTIMEDIA_BYTES", "52428800")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load() error = %v, want nil", err)
	}
	if cfg.MultimediaURL != "http://multimedia:8081" {
		t.Errorf("MultimediaURL = %q, want %q", cfg.MultimediaURL, "http://multimedia:8081")
	}
	if cfg.MaxMultimediaBytes != 52428800 {
		t.Errorf("MaxMultimediaBytes = %d, want %d", cfg.MaxMultimediaBytes, 52428800)
	}
}

func TestLoad_MaxMultimediaBytesInvalido(t *testing.T) {
	for _, valor := range []string{"abc", "0", "-1"} {
		t.Run(valor, func(t *testing.T) {
			entornoMinimo(t)
			t.Setenv("MAX_MULTIMEDIA_BYTES", valor)

			if _, err := Load(); err == nil {
				t.Errorf("Load() con MAX_MULTIMEDIA_BYTES=%q error = nil, want error", valor)
			}
		})
	}
}

func TestLoad_FotoPorDefecto(t *testing.T) {
	entornoMinimo(t)

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load() error = %v, want nil", err)
	}
	if cfg.MaxFotoBytes != defaultMaxFotoBytes || cfg.MaxFotoPixeles != defaultMaxFotoPixeles {
		t.Errorf("límites de foto = %d/%d, want los valores por defecto", cfg.MaxFotoBytes, cfg.MaxFotoPixeles)
	}
	if cfg.MaxVideoBytes != defaultMaxVideoBytes || cfg.MaxVideoSegundos != defaultMaxVideoSegundos {
		t.Errorf("límites de video = %d/%d, want los valores por defecto", cfg.MaxVideoBytes, cfg.MaxVideoSegundos)
	}
}

func TestLoad_FotoDelEntorno(t *testing.T) {
	entornoMinimo(t)
	t.Setenv("MAX_FOTO_BYTES", "500000")
	t.Setenv("MAX_FOTO_PIXELES", "1000000")
	t.Setenv("MAX_VIDEO_BYTES", "700000")
	t.Setenv("MAX_VIDEO_SEGUNDOS", "9")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load() error = %v, want nil", err)
	}
	if cfg.MaxFotoBytes != 500000 || cfg.MaxFotoPixeles != 1000000 {
		t.Errorf("límites de foto = %d/%d, want 500000/1000000", cfg.MaxFotoBytes, cfg.MaxFotoPixeles)
	}
	if cfg.MaxVideoBytes != 700000 || cfg.MaxVideoSegundos != 9 {
		t.Errorf("límites de video = %d/%d, want 700000/9", cfg.MaxVideoBytes, cfg.MaxVideoSegundos)
	}
}

func TestLoad_FotoInvalida(t *testing.T) {
	for _, variable := range variablesFoto {
		for _, valor := range []string{"abc", "0", "-5"} {
			t.Run(variable+"="+valor, func(t *testing.T) {
				entornoMinimo(t)
				t.Setenv(variable, valor)

				if _, err := Load(); err == nil {
					t.Errorf("Load() con %s=%q error = nil, want error", variable, valor)
				}
			})
		}
	}
}

func TestLoad_MantenimientoPorDefecto(t *testing.T) {
	entornoMinimo(t)

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load() error = %v, want nil", err)
	}
	if cfg.MantenimientoHora != 3 || cfg.MantenimientoMinuto != 0 {
		t.Errorf("hora = %02d:%02d, want 03:00", cfg.MantenimientoHora, cfg.MantenimientoMinuto)
	}
	if cfg.MantenimientoMaxAcciones != defaultMantenimientoMaxAcciones {
		t.Errorf("MantenimientoMaxAcciones = %d, want %d", cfg.MantenimientoMaxAcciones, defaultMantenimientoMaxAcciones)
	}
	if cfg.CuarentenaDias != defaultCuarentenaDias {
		t.Errorf("CuarentenaDias = %d, want %d", cfg.CuarentenaDias, defaultCuarentenaDias)
	}
}

func TestLoad_MantenimientoDelEntorno(t *testing.T) {
	entornoMinimo(t)
	t.Setenv("MANTENIMIENTO_HORA", "23:45")
	t.Setenv("MANTENIMIENTO_MAX_ACCIONES", "5")
	t.Setenv("CUARENTENA_DIAS", "7")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load() error = %v, want nil", err)
	}
	if cfg.MantenimientoHora != 23 || cfg.MantenimientoMinuto != 45 {
		t.Errorf("hora = %02d:%02d, want 23:45", cfg.MantenimientoHora, cfg.MantenimientoMinuto)
	}
	if cfg.MantenimientoMaxAcciones != 5 {
		t.Errorf("MantenimientoMaxAcciones = %d, want 5", cfg.MantenimientoMaxAcciones)
	}
	if cfg.CuarentenaDias != 7 {
		t.Errorf("CuarentenaDias = %d, want 7", cfg.CuarentenaDias)
	}
}

func TestLoad_MantenimientoInvalido(t *testing.T) {
	tests := []struct{ variable, valor string }{
		{"MANTENIMIENTO_HORA", "3"},
		{"MANTENIMIENTO_HORA", "25:00"},
		{"MANTENIMIENTO_HORA", "03:60"},
		{"MANTENIMIENTO_HORA", "tres"},
		{"MANTENIMIENTO_MAX_ACCIONES", "0"},
		{"MANTENIMIENTO_MAX_ACCIONES", "abc"},
		{"CUARENTENA_DIAS", "-1"},
		{"CUARENTENA_DIAS", "abc"},
	}

	for _, tt := range tests {
		t.Run(tt.variable+"="+tt.valor, func(t *testing.T) {
			entornoMinimo(t)
			t.Setenv(tt.variable, tt.valor)

			if _, err := Load(); err == nil {
				t.Errorf("Load() con %s=%q error = nil, want error", tt.variable, tt.valor)
			}
		})
	}
}
