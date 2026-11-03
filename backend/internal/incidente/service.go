package incidente

import (
	"context"
	"fmt"
	"math"
	"regexp"
	"strings"
	"unicode/utf8"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/db"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/db/sqlc"
	"github.com/google/uuid"
)

// store es lo que el servicio necesita de Store; los tests lo cumplen con un
// falso en memoria.
type store interface {
	CreateIncidenteConTags(ctx context.Context, arg CreateTxParams) (Detalle, error)
	CreateTags(ctx context.Context, arg CreateTagsTxParams) ([]sqlc.Tag, error)
	GetIncidenteById(ctx context.Context, id int) (sqlc.Incidente, error)
	ListIncidentes(ctx context.Context, incluirInactivos bool) ([]sqlc.Incidente, error)
	ListTagsByIncidenteId(ctx context.Context, incidenteID int) ([]sqlc.Tag, error)
	ListTagsByIncidenteIds(ctx context.Context, incidenteIds []int) ([]sqlc.Tag, error)
}

type Service struct {
	store store
}

func NewService(store store) *Service {
	return &Service{store: store}
}

// Valores por defecto de las columnas. Deben coincidir con los DEFAULT de la
// base (001_init_schema y 006_incidentes_color): las consultas mandan todas
// las columnas, así que los DEFAULT de la base nunca aplican.
const (
	colorPorDefecto = "#757575"
	pesoPorDefecto  = 1
)

// Límites de las columnas (incidentes.nombre VARCHAR(100), tags.nombre
// VARCHAR(50)) y de tags por petición (maxItems en el contrato).
const (
	maxNombreIncidente = 100
	maxNombreTag       = 50
	maxTags            = 50
)

var colorHex = regexp.MustCompile(`^#[0-9A-Fa-f]{6}$`)

// Crear da de alta un tipo de incidente junto con los tags de su catálogo.
// Los opcionales que lleguen en nil toman su valor por defecto.
//
// Valida aquí lo que el contrato declara (el servidor generado no lo hace),
// para responder 400 en vez de que la base rechace el INSERT con un 500.
// Los tags repetidos también se rechazan aquí: así un UNIQUE roto en la base
// solo puede ser el nombre del incidente.
func (s *Service) Crear(ctx context.Context, nuevo Nuevo, userID uuid.UUID) (Detalle, error) {
	nombre := strings.TrimSpace(nuevo.Nombre)
	if nombre == "" || utf8.RuneCountInString(nombre) > maxNombreIncidente {
		return Detalle{}, fmt.Errorf("%w: nombre debe tener entre 1 y %d caracteres", ErrInvalido, maxNombreIncidente)
	}
	if t := nuevo.TiempoLimite; t != nil && (*t < 0 || *t > math.MaxInt16) {
		return Detalle{}, fmt.Errorf("%w: tiempo_limite debe estar entre 0 y %d", ErrInvalido, math.MaxInt16)
	}
	if nuevo.Radio != nil && *nuevo.Radio < 0 {
		return Detalle{}, fmt.Errorf("%w: radio no puede ser negativo", ErrInvalido)
	}
	// Sin etiqueta se muestra el nombre, para que el título del reporte nunca quede vacío.
	etiqueta := nombre
	if nuevo.Etiqueta != nil {
		etiqueta = strings.TrimSpace(*nuevo.Etiqueta)
		if etiqueta == "" || utf8.RuneCountInString(etiqueta) > maxNombreIncidente {
			return Detalle{}, fmt.Errorf("%w: etiqueta debe tener entre 1 y %d caracteres", ErrInvalido, maxNombreIncidente)
		}
	}

	params := sqlc.CreateIncidenteParams{
		Nombre:       nombre,
		Etiqueta:     etiqueta,
		TiempoLimite: nuevo.TiempoLimite,
		Radio:        nuevo.Radio,
		Color:        colorPorDefecto,
		EstaActivo:   true,
	}
	if nuevo.Color != nil {
		if !colorHex.MatchString(*nuevo.Color) {
			return Detalle{}, fmt.Errorf("%w: color debe tener formato #RRGGBB", ErrInvalido)
		}
		params.Color = *nuevo.Color
	}
	if nuevo.EstaActivo != nil {
		params.EstaActivo = *nuevo.EstaActivo
	}

	tags, err := validarTags(nuevo.Tags)
	if err != nil {
		return Detalle{}, err
	}

	detalle, err := s.store.CreateIncidenteConTags(ctx, CreateTxParams{
		Incidente: params,
		Tags:      tags,
		ActorID:   userID,
	})
	if err != nil {
		if db.IsUniqueViolation(err) {
			return Detalle{}, ErrNameTaken
		}
		return Detalle{}, err
	}
	return detalle, nil
}

// validarTags normaliza los tags y los convierte en parámetros del INSERT.
// Rechaza nombres vacíos o demasiado largos, pesos menores a 1 y nombres
// repetidos sin importar mayúsculas ("Luz" y "luz").
func validarTags(nuevos []NuevoTag) ([]sqlc.CreateTagParams, error) {
	if len(nuevos) > maxTags {
		return nil, fmt.Errorf("%w: no se pueden crear más de %d tags a la vez", ErrInvalido, maxTags)
	}

	tags := make([]sqlc.CreateTagParams, 0, len(nuevos))
	vistos := make(map[string]bool, len(nuevos))
	for _, t := range nuevos {
		nombre := strings.TrimSpace(t.Nombre)
		if nombre == "" || utf8.RuneCountInString(nombre) > maxNombreTag {
			return nil, fmt.Errorf("%w: cada tag debe tener entre 1 y %d caracteres", ErrInvalido, maxNombreTag)
		}

		clave := strings.ToLower(nombre)
		if vistos[clave] {
			return nil, fmt.Errorf("%w: tag %q repetido", ErrInvalido, nombre)
		}
		vistos[clave] = true

		peso := pesoPorDefecto
		if t.Peso != nil {
			if *t.Peso < 1 || *t.Peso > math.MaxInt32 {
				return nil, fmt.Errorf("%w: el peso de %q debe estar entre 1 y %d", ErrInvalido, nombre, math.MaxInt32)
			}
			peso = *t.Peso
		}

		tags = append(tags, sqlc.CreateTagParams{Nombre: nombre, Peso: peso})
	}
	return tags, nil
}

// Listar devuelve los incidentes con sus tags, ordenados por nombre. Los
// inactivos solo se incluyen si incluirInactivos es true.
//
// Los tags de todos los incidentes se piden en una sola consulta y se
// reparten aquí, en vez de hacer una consulta por incidente.
func (s *Service) Listar(ctx context.Context, incluirInactivos bool) ([]Detalle, error) {
	incidentes, err := s.store.ListIncidentes(ctx, incluirInactivos)
	if err != nil {
		return nil, err
	}
	if len(incidentes) == 0 {
		return []Detalle{}, nil
	}

	ids := make([]int, 0, len(incidentes))
	for _, i := range incidentes {
		ids = append(ids, i.ID)
	}
	tags, err := s.store.ListTagsByIncidenteIds(ctx, ids)
	if err != nil {
		return nil, err
	}

	porIncidente := make(map[int][]sqlc.Tag, len(incidentes))
	for _, t := range tags {
		porIncidente[t.IncidenteID] = append(porIncidente[t.IncidenteID], t)
	}

	detalles := make([]Detalle, 0, len(incidentes))
	for _, i := range incidentes {
		detalles = append(detalles, Detalle{Incidente: i, Tags: porIncidente[i.ID]})
	}
	return detalles, nil
}

// Obtener devuelve el incidente con sus tags, esté activo o no.
func (s *Service) Obtener(ctx context.Context, id int) (Detalle, error) {
	incidente, err := s.store.GetIncidenteById(ctx, id)
	if err != nil {
		if db.IsNotFound(err) {
			return Detalle{}, ErrNotFound
		}
		return Detalle{}, err
	}

	tags, err := s.store.ListTagsByIncidenteId(ctx, id)
	if err != nil {
		return Detalle{}, err
	}
	return Detalle{Incidente: incidente, Tags: tags}, nil
}

// AgregarTags agrega tags al catálogo de un incidente existente, todos o
// ninguno.
//
// El UNIQUE (incidente_id, nombre) de la base distingue mayúsculas, así que
// aquí se compara contra los tags que ya tiene el incidente sin
// distinguirlas, igual que validarTags dentro de la misma petición.
func (s *Service) AgregarTags(ctx context.Context, incidenteID int, userID uuid.UUID, nuevos []NuevoTag) ([]sqlc.Tag, error) {
	if len(nuevos) == 0 {
		return nil, fmt.Errorf("%w: hay que mandar al menos un tag", ErrInvalido)
	}
	tags, err := validarTags(nuevos)
	if err != nil {
		return nil, err
	}

	if _, err := s.store.GetIncidenteById(ctx, incidenteID); err != nil {
		if db.IsNotFound(err) {
			return nil, ErrNotFound
		}
		return nil, err
	}

	existentes, err := s.store.ListTagsByIncidenteId(ctx, incidenteID)
	if err != nil {
		return nil, err
	}
	usados := make(map[string]bool, len(existentes))
	for _, t := range existentes {
		usados[strings.ToLower(t.Nombre)] = true
	}
	for i := range tags {
		if usados[strings.ToLower(tags[i].Nombre)] {
			return nil, fmt.Errorf("%w: %q", ErrTagNameTaken, tags[i].Nombre)
		}
	}

	creados, err := s.store.CreateTags(ctx, CreateTagsTxParams{
		IncidenteID: incidenteID,
		Tags:        tags,
		ActorID:     userID,
	})
	if err != nil {
		// Las dos comprobaciones de arriba pueden quedar viejas si otra
		// petición crea el mismo tag o borra el incidente entre medio.
		if db.IsUniqueViolation(err) {
			return nil, ErrTagNameTaken
		}
		if db.IsForeignKeyViolation(err, "tags_incidente_id_fkey") {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return creados, nil
}
