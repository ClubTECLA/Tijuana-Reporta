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
