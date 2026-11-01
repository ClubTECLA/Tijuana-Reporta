package httperr_test

import (
	"errors"
	"fmt"
	"net/http"
	"testing"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/domain"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/httperr"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/reporte"
)

// tabla es la que arma el servidor: las reglas de dominio y las de transporte.
var tabla = httperr.NewTabla(reporte.ReglasHTTP, domain.ReglasHTTP)

func TestResolver(t *testing.T) {
	tests := []struct {
		name        string
		err         error
		wantStatus  int
		wantMessage string
	}{
		{"reporte no encontrado", domain.ErrReporteNotFound, http.StatusNotFound, "reporte no encontrado"},
		{"transición inválida", reporte.ErrTransicionInvalida, http.StatusConflict, "transicion no valida"},
		{"email registrado", domain.ErrEmailTaken, http.StatusConflict, "el email ya está registrado"},
		{"credenciales inválidas", domain.ErrInvalidCredentials, http.StatusUnauthorized, "credenciales invalidas"},
		{"usuario no encontrado", domain.ErrUserNotFound, http.StatusUnauthorized, "no autenticado"},
		{"multimedia ya existe", domain.ErrMultimediaYaExiste, http.StatusConflict, "multimedia ya existe"},
		{"archivo inválido", domain.ErrArchivoInvalido, http.StatusBadRequest, "archivo invalido"},
		{"archivo muy grande", domain.ErrArchivoMuyGrande, http.StatusRequestEntityTooLarge, "archivo muy grande"},
		{"imagen muy grande", domain.ErrImagenMuyGrande, http.StatusUnprocessableEntity, "imagen muy grande"},
		{"almacén no disponible", domain.ErrAlmacenNoDisponible, http.StatusServiceUnavailable, "almacenamiento no disponible, intenta más tarde"},
		{"incidente no encontrado", domain.ErrIncidenteNotFound, http.StatusNotFound, "incidente no encontrado"},
		{"incidente inválido", domain.ErrIncidenteInvalido, http.StatusBadRequest, "invalid incidente"},
		{"nombre de incidente repetido", domain.ErrIncidenteNameTaken, http.StatusConflict, "ya existe un incidente con ese nombre"},
		{"nombre de tag repetido", domain.ErrTagNameTaken, http.StatusConflict, "el incidente ya tiene un tag con ese nombre"},
		{"área incompleta", reporte.ErrAreaIncompleta, http.StatusBadRequest, "area incompleta"},
		{"área inválida", reporte.ErrAreaInvalida, http.StatusBadRequest, "area invalida"},
		{"estado inválido", reporte.ErrEstadoInvalido, http.StatusBadRequest, "estado invalido"},
		{"oficial no permitido", reporte.ErrOficialNoPermitido, http.StatusForbidden, "un ciudadano no puede crear reportes oficiales"},
		{"estado no permitido", reporte.ErrEstadoNoPermitido, http.StatusForbidden, "un ciudadano no puede cambiar el estado de un reporte"},
		{"no autenticado", httperr.ErrNoAutenticado, http.StatusUnauthorized, "no autenticado"},
		{"token inválido", httperr.ErrTokenInvalido, http.StatusUnauthorized, "token invalido"},
		{"prohibido", httperr.ErrProhibido, http.StatusForbidden, "prohibido"},
		{"body muy grande", httperr.ErrBodyMuyGrande, http.StatusRequestEntityTooLarge, "body muy grande"},
		{"body inválido", httperr.ErrBodyInvalido, http.StatusBadRequest, "body invalido"},

		// El orden de la tabla y errors.Is existen para esto: los servicios
		// envuelven los sentinels con contexto.
		{"envuelto", fmt.Errorf("x: %w", domain.ErrReporteNotFound), http.StatusNotFound, "reporte no encontrado"},
		// Las reglas sin mensaje fijo pasan el detalle del servicio tal cual.
		{"incidente inválido con detalle", fmt.Errorf("%w: radio no puede ser negativo", domain.ErrIncidenteInvalido), http.StatusBadRequest, "invalid incidente: radio no puede ser negativo"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			status, body := tabla.Resolver(tt.err)
			if status != tt.wantStatus {
				t.Errorf("status = %d, quería %d", status, tt.wantStatus)
			}
			if body.Message != tt.wantMessage {
				t.Errorf("message = %q, quería %q", body.Message, tt.wantMessage)
			}
		})
	}
}

func TestResolver_ErrorDesconocido(t *testing.T) {
	status, body := tabla.Resolver(errors.New("pq: password authentication failed for user admin"))
	if status != http.StatusInternalServerError {
		t.Errorf("status = %d, quería %d", status, http.StatusInternalServerError)
	}
	if body.Message != "internal server error" {
		t.Errorf("message = %q, no debe filtrar el error original", body.Message)
	}
}

// TestResolver_TodosLosErroresDeDominio falla si a un error de
// domain/errors.go o de una funcionalidad le falta su regla y acaba como
// 500. La lista se mantiene a mano: al agregar un Err…, agrégalo aquí también.
func TestResolver_TodosLosErroresDeDominio(t *testing.T) {
	errs := []error{
		reporte.ErrNotFound,
		reporte.ErrIncidenteNotFound,
		domain.ErrEmailTaken,
		domain.ErrInvalidCredentials,
		domain.ErrUserNotFound,
		domain.ErrReporteNotFound,
		domain.ErrIncidenteNotFound,
		domain.ErrIncidenteInvalido,
		domain.ErrArchivoInvalido,
		domain.ErrArchivoMuyGrande,
		domain.ErrImagenMuyGrande,
		domain.ErrMultimediaYaExiste,
		domain.ErrAlmacenNoDisponible,
		domain.ErrIncidenteNameTaken,
		domain.ErrTagNameTaken,
		reporte.ErrAreaIncompleta,
		reporte.ErrAreaInvalida,
		reporte.ErrEstadoInvalido,
		reporte.ErrTransicionInvalida,
		reporte.ErrOficialNoPermitido,
		reporte.ErrEstadoNoPermitido,
	}

	for _, err := range errs {
		status, _ := tabla.Resolver(err)
		// 503 es un estado buscado (almacén caído), no la caída por defecto.
		if status == http.StatusInternalServerError {
			t.Errorf("%q resuelve a 500: falta su regla en ReglasHTTP", err)
		}
	}
}
