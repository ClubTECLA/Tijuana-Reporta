package config

import (
	"fmt"
	"os"
	"strconv"
)

// defaultMaxArchivoBytes es el tamaño máximo de un archivo a guardar (12 MiB,
// igual que el límite de la ruta de multimedia del backend).
const defaultMaxArchivoBytes = 12 << 20

// defaultMaxFotoBytes es el tamaño a partir del cual una foto guardada se
// considera demasiado grande al revisarla (3 MiB, igual que MAX_FOTO_BYTES del backend).
const defaultMaxFotoBytes = 3 << 20

// defaultMaxVideoBytes es lo mismo para un video (8 MiB, igual que MAX_VIDEO_BYTES del backend).
const defaultMaxVideoBytes = 8 << 20

// defaultUploadsDir es el directorio donde se guardan los archivos.
const defaultUploadsDir = "uploads"

// defaultCuarentenaDir es el directorio donde se aparta lo que no cumple las
// reglas. Debe quedar fuera de UploadsDir, que es lo que sirve nginx.
const defaultCuarentenaDir = "cuarentena"

// Config reúne la configuración del servicio leída de variables de entorno.
type Config struct {
	Port            string
	UploadsDir      string
	CuarentenaDir   string
	MaxArchivoBytes int64
	MaxFotoBytes    int64
	MaxVideoBytes   int64
}

// Load lee la configuración del entorno.
func Load() (Config, error) {
	cfg := Config{
		Port:          os.Getenv("MULTIMEDIA_PORT"),
		UploadsDir:    os.Getenv("UPLOADS_DIR"),
		CuarentenaDir: os.Getenv("CUARENTENA_DIR"),
	}
	if cfg.Port == "" {
		cfg.Port = "8081"
	}
	if cfg.UploadsDir == "" {
		cfg.UploadsDir = defaultUploadsDir
	}
	if cfg.CuarentenaDir == "" {
		cfg.CuarentenaDir = defaultCuarentenaDir
	}

	var err error
	if cfg.MaxArchivoBytes, err = enteroPositivo("MAX_ARCHIVO_BYTES", defaultMaxArchivoBytes); err != nil {
		return Config{}, err
	}

	if cfg.MaxFotoBytes, err = enteroPositivo("MAX_FOTO_BYTES", defaultMaxFotoBytes); err != nil {
		return Config{}, err
	}

	if cfg.MaxVideoBytes, err = enteroPositivo("MAX_VIDEO_BYTES", defaultMaxVideoBytes); err != nil {
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
