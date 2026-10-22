package config

import (
	"fmt"
	"os"
	"strconv"
)

// defaultMaxArchivoBytes es el tamaño máximo de un archivo a guardar (12 MiB,
// igual que el límite de la ruta de multimedia del backend).
const defaultMaxArchivoBytes = 12 << 20

// defaultUploadsDir es el directorio donde se guardan los archivos.
const defaultUploadsDir = "uploads"

// Config reúne la configuración del servicio leída de variables de entorno.
type Config struct {
	Port            string
	UploadsDir      string
	MaxArchivoBytes int64
}

// Load lee la configuración del entorno.
func Load() (Config, error) {
	cfg := Config{
		Port:       os.Getenv("MULTIMEDIA_PORT"),
		UploadsDir: os.Getenv("UPLOADS_DIR"),
	}
	if cfg.Port == "" {
		cfg.Port = "8081"
	}
	if cfg.UploadsDir == "" {
		cfg.UploadsDir = defaultUploadsDir
	}

	var err error
	if cfg.MaxArchivoBytes, err = enteroPositivo("MAX_ARCHIVO_BYTES", defaultMaxArchivoBytes); err != nil {
		return Config{}, err
	}

	return cfg, nil
}

// enteroPositivo lee la variable nombre como entero mayor que cero, o def si no está definida.
func enteroPositivo(nombre string, def int64) (int64, error) {
	raw := os.Getenv(nombre)
	if raw == "" {
		return def, nil
	}

	n, err := strconv.ParseInt(raw, 10, 64)
	if err != nil {
		return 0, fmt.Errorf("invalid %s: %w", nombre, err)
	}
	if n <= 0 {
		return 0, fmt.Errorf("%s must be greater than zero", nombre)
	}
	return n, nil
}
