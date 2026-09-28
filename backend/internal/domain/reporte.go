package domain

import "github.com/google/uuid"

// Archivo escrito a mano: convive con el código generado por sqlc, que solo
// reescribe models.go, querier.go, db.go y los *.sql.go.

// CreateReporteTxParams agrupa todo lo que se inserta al crear un reporte:
// el reporte en sí, la ubicación inicial y sus fotos. No se llama
// CreateReporteParams porque ese nombre ya lo usa sqlc para el INSERT simple.
type CreateReporteTxParams struct {
	Reporte    CreateReporteParams
	UserID     uuid.UUID
	Latitude   float64
	Longitude  float64
	ImagePaths []string
}
