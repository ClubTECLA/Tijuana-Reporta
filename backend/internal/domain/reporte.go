package domain

import "github.com/google/uuid"

// Archivo escrito a mano: convive con el código generado por sqlc, que solo
// reescribe models.go, querier.go, db.go y los *.sql.go.

// CreateReporteTxParams agrupa todo lo que se inserta al crear un reporte:
// el reporte en sí y la ubicación inicial. No se llama CreateReporteParams
// porque ese nombre ya lo usa sqlc para el INSERT simple.
type CreateReporteTxParams struct {
	Reporte   CreateReporteParams
	UserID    uuid.UUID
	Latitude  float64
	Longitude float64
}

// ReporteDetalle agrupa el reporte con todo lo que depende de este.
type ReporteDetalle struct {
	Reporte     Reporte
	Latitude    float64
	Longitude   float64
	Comentarios []Comentario
	Multimedia  []Multimedia
	Tags        []ListTagsByReporteIdRow
	Locations   []Location
}
