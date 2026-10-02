package service

import (
	"context"
	"fmt"
	"math"
	"regexp"
	"strings"
	"unicode/utf8"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/domain"
)

// IncidenteStore es el subconjunto de *database.Store que este servicio usa.
type IncidenteStore interface {
	CreateIncidenteConTags(ctx context.Context, arg domain.CreateIncidenteTxParams) (domain.IncidenteDetalle, error)
	CreateTags(ctx context.Context, arg []domain.CreateTagParams) ([]domain.Tag, error)
	GetIncidenteById(ctx context.Context, id int) (domain.Incidente, error)
	ListIncidentes(ctx context.Context, incluirInactivos bool) ([]domain.Incidente, error)
	ListTagsByIncidenteId(ctx context.Context, incidenteID int) ([]domain.Tag, error)
	ListTagsByIncidenteIds(ctx context.Context, incidenteIds []int) ([]domain.Tag, error)
}

type IncidenteService struct {
	store IncidenteStore
}

func NewIncidenteService(store IncidenteStore) *IncidenteService {
	return &IncidenteService{store: store}
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
func (s *IncidenteService) Crear(ctx context.Context, nuevo domain.NuevoIncidente) (domain.IncidenteDetalle, error) {
	nombre := strings.TrimSpace(nuevo.Nombre)
	if nombre == "" || utf8.RuneCountInString(nombre) > maxNombreIncidente {
		return domain.IncidenteDetalle{}, fmt.Errorf("%w: nombre debe tener entre 1 y %d caracteres", domain.ErrIncidenteInvalido, maxNombreIncidente)
	}
	if t := nuevo.TiempoLimite; t != nil && (*t < 0 || *t > math.MaxInt16) {
		return domain.IncidenteDetalle{}, fmt.Errorf("%w: tiempo_limite debe estar entre 0 y %d", domain.ErrIncidenteInvalido, math.MaxInt16)
	}
	if nuevo.Radio != nil && *nuevo.Radio < 0 {
		return domain.IncidenteDetalle{}, fmt.Errorf("%w: radio no puede ser negativo", domain.ErrIncidenteInvalido)
	}

	params := domain.CreateIncidenteParams{
		Nombre:       nombre,
		TiempoLimite: nuevo.TiempoLimite,
		Radio:        nuevo.Radio,
		Color:        colorPorDefecto,
		EstaActivo:   true,
	}
	if nuevo.Color != nil {
		if !colorHex.MatchString(*nuevo.Color) {
			return domain.IncidenteDetalle{}, fmt.Errorf("%w: color debe tener formato #RRGGBB", domain.ErrIncidenteInvalido)
		}
		params.Color = *nuevo.Color
	}
	if nuevo.EstaActivo != nil {
		params.EstaActivo = *nuevo.EstaActivo
	}

	tags, err := validarTags(nuevo.Tags)
	if err != nil {
		return domain.IncidenteDetalle{}, err
	}

	detalle, err := s.store.CreateIncidenteConTags(ctx, domain.CreateIncidenteTxParams{
		Incidente: params,
		Tags:      tags,
	})
	if err != nil {
		if domain.IsUniqueViolation(err) {
			return domain.IncidenteDetalle{}, domain.ErrIncidenteNameTaken
		}
		return domain.IncidenteDetalle{}, err
	}
	return detalle, nil
}

// validarTags normaliza los tags y los convierte en parámetros del INSERT.
// Rechaza nombres vacíos o demasiado largos, pesos menores a 1 y nombres
// repetidos sin importar mayúsculas ("Luz" y "luz").
func validarTags(nuevos []domain.NuevoTag) ([]domain.CreateTagParams, error) {
	if len(nuevos) > maxTags {
		return nil, fmt.Errorf("%w: no se pueden crear más de %d tags a la vez", domain.ErrIncidenteInvalido, maxTags)
	}

	tags := make([]domain.CreateTagParams, 0, len(nuevos))
	vistos := make(map[string]bool, len(nuevos))
	for _, t := range nuevos {
		nombre := strings.TrimSpace(t.Nombre)
		if nombre == "" || utf8.RuneCountInString(nombre) > maxNombreTag {
			return nil, fmt.Errorf("%w: cada tag debe tener entre 1 y %d caracteres", domain.ErrIncidenteInvalido, maxNombreTag)
		}

		clave := strings.ToLower(nombre)
		if vistos[clave] {
			return nil, fmt.Errorf("%w: tag %q repetido", domain.ErrIncidenteInvalido, nombre)
		}
		vistos[clave] = true

		peso := pesoPorDefecto
		if t.Peso != nil {
			if *t.Peso < 1 || *t.Peso > math.MaxInt32 {
				return nil, fmt.Errorf("%w: el peso de %q debe estar entre 1 y %d", domain.ErrIncidenteInvalido, nombre, math.MaxInt32)
			}
			peso = *t.Peso
		}

		tags = append(tags, domain.CreateTagParams{Nombre: nombre, Peso: peso})
	}
	return tags, nil
}

// Listar devuelve los incidentes con sus tags, ordenados por nombre. Los
// inactivos solo se incluyen si incluirInactivos es true.
//
// Los tags de todos los incidentes se piden en una sola consulta y se
// reparten aquí, en vez de hacer una consulta por incidente.
func (s *IncidenteService) Listar(ctx context.Context, incluirInactivos bool) ([]domain.IncidenteDetalle, error) {
	incidentes, err := s.store.ListIncidentes(ctx, incluirInactivos)
	if err != nil {
		return nil, err
	}
	if len(incidentes) == 0 {
		return []domain.IncidenteDetalle{}, nil
	}

	ids := make([]int, 0, len(incidentes))
	for _, i := range incidentes {
		ids = append(ids, i.ID)
	}
	tags, err := s.store.ListTagsByIncidenteIds(ctx, ids)
	if err != nil {
		return nil, err
	}

	porIncidente := make(map[int][]domain.Tag, len(incidentes))
	for _, t := range tags {
		porIncidente[t.IncidenteID] = append(porIncidente[t.IncidenteID], t)
	}

	detalles := make([]domain.IncidenteDetalle, 0, len(incidentes))
	for _, i := range incidentes {
		detalles = append(detalles, domain.IncidenteDetalle{Incidente: i, Tags: porIncidente[i.ID]})
	}
	return detalles, nil
}

// Obtener devuelve el incidente con sus tags, esté activo o no.
func (s *IncidenteService) Obtener(ctx context.Context, id int) (domain.IncidenteDetalle, error) {
	incidente, err := s.store.GetIncidenteById(ctx, id)
	if err != nil {
		if domain.IsNotFound(err) {
			return domain.IncidenteDetalle{}, domain.ErrIncidenteNotFound
		}
		return domain.IncidenteDetalle{}, err
	}

	tags, err := s.store.ListTagsByIncidenteId(ctx, id)
	if err != nil {
		return domain.IncidenteDetalle{}, err
	}
	return domain.IncidenteDetalle{Incidente: incidente, Tags: tags}, nil
}

// AgregarTags agrega tags al catálogo de un incidente existente, todos o
// ninguno.
//
// El UNIQUE (incidente_id, nombre) de la base distingue mayúsculas, así que
// aquí se compara contra los tags que ya tiene el incidente sin
// distinguirlas, igual que validarTags dentro de la misma petición.
func (s *IncidenteService) AgregarTags(ctx context.Context, incidenteID int, nuevos []domain.NuevoTag) ([]domain.Tag, error) {
	if len(nuevos) == 0 {
		return nil, fmt.Errorf("%w: hay que mandar al menos un tag", domain.ErrIncidenteInvalido)
	}
	tags, err := validarTags(nuevos)
	if err != nil {
		return nil, err
	}

	if _, err := s.store.GetIncidenteById(ctx, incidenteID); err != nil {
		if domain.IsNotFound(err) {
			return nil, domain.ErrIncidenteNotFound
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
			return nil, fmt.Errorf("%w: %q", domain.ErrTagNameTaken, tags[i].Nombre)
		}
		tags[i].IncidenteID = incidenteID
	}

	creados, err := s.store.CreateTags(ctx, tags)
	if err != nil {
		// Las dos comprobaciones de arriba pueden quedar viejas si otra
		// petición crea el mismo tag o borra el incidente entre medio.
		if domain.IsUniqueViolation(err) {
			return nil, domain.ErrTagNameTaken
		}
		if domain.IsForeignKeyViolation(err, "tags_incidente_id_fkey") {
			return nil, domain.ErrIncidenteNotFound
		}
		return nil, err
	}
	return creados, nil
}
