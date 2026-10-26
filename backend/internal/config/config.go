package config

import (
	"fmt"
	"log"
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"
)

// minJWTSecretLen son 32 bytes (256 bits), el mínimo recomendado para firmar
// HS256: por debajo de eso el secreto es más corto que el tamaño del hash y
// se vuelve más fácil de forzar por fuerza bruta.
const minJWTSecretLen = 32

const defaultJWTTTL = 24 * time.Hour

// defaultMultimediaURL apunta al servicio multimedia corriendo en el mismo host (go run).
// En compose se pasa MULTIMEDIA_URL con el nombre del servicio.
const defaultMultimediaURL = "http://localhost:8081"

// defaultMaxMultimediaBytes es el máximo del body al subir un archivo a un reporte (12 MiB).
const defaultMaxMultimediaBytes = 12 << 20

// Valores por defecto de la validación de fotos.
const (
	defaultMaxFotoBytes   = 3 << 20    // tamaño máximo de la foto de entrada; la app la comprime antes de subirla
	defaultMaxFotoPixeles = 16_000_000 // 4000x4000
)

type Config struct {
	DatabaseURL string
	APIPort     string
	JWTSecret   string
	JWTTTL      time.Duration

	MultimediaURL      string
	MaxMultimediaBytes int64

	MaxFotoBytes   int64
	MaxFotoPixeles int64
	AdminEmail     string
	AdminUsername  string
	AdminPassword  string

	LogLevel  string
	LogFormat string
}

func Load() (Config, error) {
	err := godotenv.Load()

	if err != nil {
		log.Println("Warning: .env file not found, using environment variables")
	}

	cfg := Config{
		DatabaseURL:   os.Getenv("DATABASE_URL"),
		APIPort:       os.Getenv("API_PORT"),
		JWTSecret:     os.Getenv("JWT_SECRET"),
		AdminEmail:    os.Getenv("ADMIN_EMAIL"),
		AdminUsername: getEnvOrDefault("ADMIN_USERNAME", "Administrador"),
		AdminPassword: os.Getenv("ADMIN_PASSWORD"),
		LogLevel:      getEnvOrDefault("LOG_LEVEL", "info"),
		LogFormat:     getEnvOrDefault("LOG_FORMAT", "json"),
	}
	var missing []string
	if cfg.DatabaseURL == "" {
		missing = append(missing, "DATABASE_URL")
	}
	if (cfg.AdminEmail == "") != (cfg.AdminPassword == "") {
		return Config{}, fmt.Errorf("ADMIN_EMAIL y ADMIN_PASSWORD deben definirse juntas, o dejar ambas vacías")
	}
	if cfg.APIPort == "" {
		// Use default value
		cfg.APIPort = "8080"
	}
	if cfg.JWTSecret == "" {
		missing = append(missing, "JWT_SECRET")
	}
	if len(missing) > 0 {
		return Config{}, fmt.Errorf("missing environment vars: %v", missing)
	}
	if len(cfg.JWTSecret) < minJWTSecretLen {
		return Config{}, fmt.Errorf("JWT_SECRET must be at least %d bytes long, got %d", minJWTSecretLen, len(cfg.JWTSecret))
	}

	cfg.JWTTTL = defaultJWTTTL
	if raw := os.Getenv("JWT_TTL"); raw != "" {
		ttl, err := time.ParseDuration(raw)
		if err != nil {
			return Config{}, fmt.Errorf("invalid JWT_TTL: %w", err)
		}
		if ttl <= 0 {
			return Config{}, fmt.Errorf("JWT_TTL must be greater than zero")
		}
		cfg.JWTTTL = ttl
	}

	cfg.MultimediaURL = os.Getenv("MULTIMEDIA_URL")
	if cfg.MultimediaURL == "" {
		cfg.MultimediaURL = defaultMultimediaURL
	}

	if cfg.MaxMultimediaBytes, err = enteroPositivo("MAX_MULTIMEDIA_BYTES", defaultMaxMultimediaBytes); err != nil {
		return Config{}, err
	}
	if cfg.MaxFotoBytes, err = enteroPositivo("MAX_FOTO_BYTES", defaultMaxFotoBytes); err != nil {
		return Config{}, err
	}
	if cfg.MaxFotoPixeles, err = enteroPositivo("MAX_FOTO_PIXELES", defaultMaxFotoPixeles); err != nil {
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

func getEnvOrDefault(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}

	return fallback
}
