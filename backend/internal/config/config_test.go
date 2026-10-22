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
}

var variablesFoto = []string{"MAX_FOTO_BYTES", "MAX_FOTO_PIXELES"}

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
}

func TestLoad_FotoDelEntorno(t *testing.T) {
	entornoMinimo(t)
	t.Setenv("MAX_FOTO_BYTES", "500000")
	t.Setenv("MAX_FOTO_PIXELES", "1000000")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load() error = %v, want nil", err)
	}
	if cfg.MaxFotoBytes != 500000 || cfg.MaxFotoPixeles != 1000000 {
		t.Errorf("límites de foto = %d/%d, want 500000/1000000", cfg.MaxFotoBytes, cfg.MaxFotoPixeles)
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
