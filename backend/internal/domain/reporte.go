package domain

import "github.com/google/uuid"

// Archivo escrito a mano: convive con el código generado por sqlc, que solo
// reescribe models.go, querier.go, db.go y los *.sql.go.

// CreateReporteTxParams agrupa todo lo que se inserta al crear un reporte:
// el reporte en sí, la ubicación inicial y su multimedia, si la hay. No se llama
// CreateReporteParams porque ese nombre ya lo usa sqlc para el INSERT simple.
type CreateReporteTxParams struct {
	Reporte    CreateReporteParams
	UserID     uuid.UUID
	Latitude   float64
	Longitude  float64
	Multimedia *CrearMultimediaRequest
}

// CrearMultimediaRequest es el archivo (foto o video) que se adjunta al crear un
// reporte. Path es donde quedó guardado; el backend no recibe el archivo.
type CrearMultimediaRequest struct {
	Path string
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

type NuevoReporte struct {
	UserID      uuid.UUID
	Rol         string
	IncidenteID int
	Latitude    float64
	Longitude   float64
	EsOficial   bool
	Multimedia  *CrearMultimediaRequest
}
