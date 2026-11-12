package server_test

import (
	"net/http"
	"strconv"
	"strings"
	"testing"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/httpapi"
	"github.com/google/uuid"
)

func nombreTipoCentro() string {
	return "Tipo " + uuid.NewString()[:8]
}

func TestTiposCentro(t *testing.T) {
	admin := newTestClient(t)
	admin.loginComo("admin")
	adminID := admin.usuarioActual()

	ciudadano := newTestClient(t)
	ciudadano.login()

	nombre := nombreTipoCentro()
	var creado httpapi.TiposCentro

	t.Run("admin crea y queda en historial", func(t *testing.T) {
		tc := *admin
		tc.t = t
		rec := tc.expect(http.StatusCreated, http.MethodPost, "/v1/tipos-centro", map[string]any{"nombre": nombre})
		creado = decode[httpapi.TiposCentro](t, rec)
		if creado.Nombre != nombre || creado.Id == 0 {
			t.Fatalf("creado = %+v", creado)
		}
		id := strconv.Itoa(creado.Id)
		if n := contarHistorial(t, "tipo_centro.crear", "tipo_centro", id); n != 1 {
			t.Errorf("tipo_centro.crear: %d eventos, quería 1", n)
		}
		ev := ultimoHistorial(t, "tipo_centro", id)
		if ev.ActorID == nil || *ev.ActorID != adminID {
			t.Errorf("actor = %v, quería %v", ev.ActorID, adminID)
		}
	})

	t.Run("nombre repetido responde 409", func(t *testing.T) {
		tc := *admin
		tc.t = t
		tc.expect(http.StatusConflict, http.MethodPost, "/v1/tipos-centro", map[string]any{"nombre": nombre})
	})

	t.Run("nombre vacío o muy largo responde 400", func(t *testing.T) {
		tc := *admin
		tc.t = t
		tc.expect(http.StatusBadRequest, http.MethodPost, "/v1/tipos-centro", map[string]any{"nombre": "   "})
		tc.expect(http.StatusBadRequest, http.MethodPost, "/v1/tipos-centro", map[string]any{"nombre": strings.Repeat("x", 51)})
	})

	t.Run("ciudadano no puede crear", func(t *testing.T) {
		tc := *ciudadano
		tc.t = t
		tc.expect(http.StatusForbidden, http.MethodPost, "/v1/tipos-centro", map[string]any{"nombre": nombreTipoCentro()})
	})

	t.Run("ciudadano lista y obtiene", func(t *testing.T) {
		tc := *ciudadano
		tc.t = t
		lista := decode[[]httpapi.TiposCentro](t, tc.expect(http.StatusOK, http.MethodGet, "/v1/tipos-centro", nil))
		found := false
		for _, x := range lista {
			if x == creado {
				found = true
			}
		}
		if !found {
			t.Errorf("%+v no aparece en el listado", creado)
		}
		got := decode[httpapi.TiposCentro](t, tc.expect(http.StatusOK, http.MethodGet, "/v1/tipos-centro/"+strconv.Itoa(creado.Id), nil))
		if got != creado {
			t.Errorf("got = %+v, quería %+v", got, creado)
		}
	})

	t.Run("id inexistente responde 404", func(t *testing.T) {
		tc := *ciudadano
		tc.t = t
		tc.expect(http.StatusNotFound, http.MethodGet, "/v1/tipos-centro/2147483647", nil)
	})
}

func TestCentros(t *testing.T) {
	admin := newTestClient(t)
	admin.loginComo("admin")
	adminID := admin.usuarioActual()

	ciudadano := newTestClient(t)
	ciudadano.login()

	// Un tipo de centro para asignarlo a los centros.
	tipo := decode[httpapi.TiposCentro](t,
		admin.expect(http.StatusCreated, http.MethodPost, "/v1/tipos-centro", map[string]any{"nombre": nombreTipoCentro()}))

	body := func(extra map[string]any) map[string]any {
		b := map[string]any{
			"tipo_centro": tipo.Id,
			"nombre":      "Centro " + uuid.NewString()[:8],
			"latitude":    32.5149,
			"longitude":   -117.0382,
		}
		for k, v := range extra {
			b[k] = v
		}
		return b
	}

	var creado httpapi.Centro

	t.Run("admin crea con defaults y queda en historial", func(t *testing.T) {
		tc := *admin
		tc.t = t
		creado = decode[httpapi.Centro](t, tc.expect(http.StatusCreated, http.MethodPost, "/v1/centro", body(nil)))
		if creado.Id == uuid.Nil || !creado.Activo || creado.TipoCentro != tipo.Id {
			t.Fatalf("creado = %+v", creado)
		}
		id := creado.Id.String()
		if n := contarHistorial(t, "centro.crear", "centro", id); n != 1 {
			t.Errorf("centro.crear: %d eventos, quería 1", n)
		}
		ev := ultimoHistorial(t, "centro", id)
		if ev.ActorID == nil || *ev.ActorID != adminID {
			t.Errorf("actor = %v, quería %v", ev.ActorID, adminID)
		}
	})

	t.Run("datos inválidos responden 400", func(t *testing.T) {
		tc := *admin
		tc.t = t
		tc.expect(http.StatusBadRequest, http.MethodPost, "/v1/centro", body(map[string]any{"capacidad": 5, "cantidad": 10}))
		tc.expect(http.StatusBadRequest, http.MethodPost, "/v1/centro", body(map[string]any{"latitude": 91}))
		tc.expect(http.StatusBadRequest, http.MethodPost, "/v1/centro", body(map[string]any{"nombre": "   "}))
	})

	t.Run("tipo de centro inexistente", func(t *testing.T) {
		tc := *admin
		tc.t = t
		// Hoy ErrTipoCentroNotFound da 404; cambia el status si decides usar 400.
		tc.expect(http.StatusNotFound, http.MethodPost, "/v1/centro", body(map[string]any{"tipo_centro": 2147483647}))
	})

	t.Run("ciudadano no puede crear", func(t *testing.T) {
		tc := *ciudadano
		tc.t = t
		tc.expect(http.StatusForbidden, http.MethodPost, "/v1/centro", body(nil))
	})

	t.Run("ciudadano obtiene y lista", func(t *testing.T) {
		tc := *ciudadano
		tc.t = t
		got := decode[httpapi.Centro](t, tc.expect(http.StatusOK, http.MethodGet, "/v1/centro/"+creado.Id.String(), nil))
		if got.Id != creado.Id || got.Nombre != creado.Nombre {
			t.Errorf("got = %+v, quería %+v", got, creado)
		}
		lista := decode[[]httpapi.Centro](t, tc.expect(http.StatusOK, http.MethodGet, "/v1/centro", nil))
		found := false
		for _, c := range lista {
			if c.Id == creado.Id {
				found = true
			}
		}
		if !found {
			t.Errorf("el centro no aparece en el listado")
		}
	})

	t.Run("inactivos solo con incluir_inactivos", func(t *testing.T) {
		tc := *admin
		tc.t = t
		inactivo := decode[httpapi.Centro](t, tc.expect(http.StatusCreated, http.MethodPost, "/v1/centro", body(map[string]any{"activo": false})))

		contiene := func(ruta string) bool {
			for _, c := range decode[[]httpapi.Centro](t, tc.expect(http.StatusOK, http.MethodGet, ruta, nil)) {
				if c.Id == inactivo.Id {
					return true
				}
			}
			return false
		}
		if contiene("/v1/centro") {
			t.Error("el inactivo no debería salir por defecto")
		}
		if !contiene("/v1/centro?incluir_inactivos=true") {
			t.Error("el inactivo debería salir con incluir_inactivos=true")
		}
	})

	t.Run("id inexistente responde 404", func(t *testing.T) {
		tc := *ciudadano
		tc.t = t
		tc.expect(http.StatusNotFound, http.MethodGet, "/v1/centro/"+uuid.NewString(), nil)
	})
}
