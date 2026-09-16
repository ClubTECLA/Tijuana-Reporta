package types

import "time"

// Use pointers for optional fields to distinguish between zero values and
// missing values.

/// Base catalog
type Incidente struct {
	ID           int      `json:"id" db:"id"`
	Nombre       string   `json:"nombre" db:"nombre"`
	TiempoLimite *int     `json:"tiempo_limite" db:"tiempo_limite"`
	Radio        *float64 `json:"radio" db:"radio"`
}

type Tags struct {
	ID          int    `json:"id" db:"id"`
	IncidenteID int    `json:"incidente_id" db:"incidente_id"`
	Nombre      string `json:"nombre" db:"nombre"`
	Peso        int    `json:"peso" db:"peso"`
}

type Roles struct {
	ID     int    `json:"id" db:"id"`
	Nombre string `json:"nombre" db:"nombre"`
}

/// Users and authentication
type User struct {
	ID           int    `json:"id" db:"id"`
	Email        string `json:"email" db:"email"`
	Phone        string `json:"phone" db:"phone"`
	UserName     string `json:"username" db:"username"`
	RolID        int    `json:"rol_id" db:"rol_id"`
	PasswordHash string `json:"password_hash" db:"password_hash"`
	CreatedAt    string `json:"created_at" db:"created_at"`
	UpdatedAt    string `json:"updated_at" db:"updated_at"`
}

type AuthProvider struct {
	ID         int     `json:"id" db:"id"`
	UserID     int     `json:"user_id" db:"user_id"`
	Provider   string  `json:"provider" db:"provider"`
	ProviderID *string `json:"provider_id" db:"provider_id"`
	CreatedAt  string  `json:"created_at" db:"created_at"`
}

// Equivalent to the "estado" enum in the database
type Estado int

const (
	SinRevisar Estado = iota
	EnRevision
	Arreglado
	Expirado
)

/// Reportes
type Reporte struct {
	ID            int        `json:"id" db:"id"`
	IncidenteID   int        `json:"incidente_id" db:"incidente_id"`
	Avistamientos int        `json:"avistamientos" db:"avistamientos"`
	EsHistorico   bool       `json:"es_historico" db:"es_historico"`
	EstadoActual  Estado     `json:"estado_actual" db:"estado_actual"`
	CreatedAt     time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at" db:"updated_at"`
	ExpiratedAt   *time.Time `json:"expired_at" db:"expired_at"`
}

type Location struct {
	ID        int       `json:"id" db:"id"`
	ReporteID int       `json:"reporte_id" db:"reporte_id"`
	Latitude  float64   `json:"latitude" db:"latitude"`
	Longitude float64   `json:"longitude" db:"longitude"`
	UserID    int       `json:"user_id" db:"user_id"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

type PuntosOrigen struct {
	ID          int       `json:"id" db:"id"`
	ReporteID   int       `json:"reporte_id" db:"reporte_id"`
	Latitude    float64   `json:"latitude" db:"latitude"`
	Longitude   float64   `json:"longitude" db:"longitude"`
	SampleCount int       `json:"sample_count" db:"sample_count"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}

type FotosReporte struct {
	ID        int       `json:"id" db:"id"`
	ReporteID int       `json:"reporte_id" db:"reporte_id"`
	ImagePath string    `json:"image_path" db:"image_path"`
	UserID    int       `json:"user_id" db:"user_id"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

/// Tags de reportes
type IncidenteTag struct {
	ID        int       `json:"id" db:"id"`
	ReporteID int       `json:"reporte_id" db:"reporte_id"`
	TagID     int       `json:"tag_id" db:"tag_id"`
	AddedBy   int       `json:"added_by" db:"added_by"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

type ReporteTagCounts struct {
	ReporteID int `json:"reporte_id" db:"reporte_id"`
	TagID     int `json:"tag_id" db:"tag_id"`
	Count     int `json:"count" db:"count"`
}

type ReportesScores struct {
	ReporteID  int `json:"reporte_id" db:"reporte_id"`
	TotalScore int `json:"total_score" db:"total_score"`
}

/// Comentarios e historial
type Comentarios struct {
	ID         int       `json:"id" db:"id"`
	ReporteID  int       `json:"reporte_id" db:"reporte_id"`
	UserID     int       `json:"user_id" db:"user_id"`
	Comentario string    `json:"comentario" db:"comentario"`
	CreatedAt  time.Time `json:"created_at" db:"created_at"`
}

type UsersReports struct {
	ID        int `json:"id" db:"id"`
	UserID    int `json:"user_id" db:"user_id"`
	ReporteID int `json:"reporte_id" db:"reporte_id"`
}

type Logs struct {
	ID          int       `json:"id" db:"id"`
	IncidenteID int       `json:"incidente_id" db:"incidente_id"`
	Longitude   float64   `json:"longitude" db:"longitude"`
	Latitude    float64   `json:"latitude" db:"latitude"`
	Peso        int       `json:"peso" db:"peso"`
	StartedAt   time.Time `json:"started_at" db:"started_at"`
	FinishedAt  time.Time `json:"finished_at" db:"finished_at"`
}
