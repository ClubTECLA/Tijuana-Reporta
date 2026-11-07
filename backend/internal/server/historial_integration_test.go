package server_test

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"testing"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/db/sqlc"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/httpapi"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/usuario"
	"github.com/google/uuid"
)

// crearActor registra un usuario directo en la store y devuelve su id, para
// los tests que llaman a la store sin pasar por la API: actor_id del
// historial es FK a users, así que no sirve un uuid inventado.
func crearActor(t *testing.T, store *usuario.Store) uuid.UUID {
	t.Helper()

	rol, err := store.GetDefaultRole(t.Context())
	if err != nil {
		t.Fatalf("obteniendo rol por defecto: %v", err)
	}
	email, _ := credenciales()
	u, err := store.CreateUserWithLocalProvider(t.Context(), sqlc.CreateUserParams{
		Email: &email, Username: "actor", RolID: rol.ID,
	})
	if err != nil {
		t.Fatalf("creando actor: %v", err)
	}
	return u.ID
}

// contarHistorial cuenta los eventos de historial con esa acción sobre esa
// entidad.
func contarHistorial(t *testing.T, accion, entidad, entidadID string) int {
	t.Helper()

	var n int
	err := testPool(t).QueryRow(t.Context(),
		`SELECT count(*) FROM historial WHERE accion = $1 AND entidad = $2 AND entidad_id = $3`,
		accion, entidad, entidadID).Scan(&n)
	if err != nil {
		t.Fatalf("contando historial: %v", err)
	}
	return n
}

// ultimoHistorial devuelve el evento más reciente de esa entidad.
func ultimoHistorial(t *testing.T, entidad, entidadID string) sqlc.Historial {
	t.Helper()

	eventos, err := sqlc.New(testPool(t)).ListHistorialPorEntidad(t.Context(), sqlc.ListHistorialPorEntidadParams{
		Entidad: entidad, EntidadID: entidadID, Limit: 1,
	})
	if err != nil {
		t.Fatalf("listando historial: %v", err)
	}
	if len(eventos) == 0 {
		t.Fatalf("no hay historial para %s %s", entidad, entidadID)
	}
	return eventos[0]
}

// usuarioActual devuelve el id del usuario autenticado en el cliente.
func (c *testClient) usuarioActual() uuid.UUID {
	c.t.Helper()

	return decode[httpapi.UsuarioMeResponse](c.t, c.expect(http.StatusOK, http.MethodGet, "/v1/auth/me", nil)).Id
}

// TestHistorial revisa que cada operación que escribe deje su evento en el
// historial, con el actor correcto.
func TestHistorial(t *testing.T) {
	ciudadano := newTestClient(t)
	auth := ciudadano.login()
	if n := contarHistorial(t, "usuario.registrar", "usuario", auth.User.Id.String()); n != 1 {
		t.Errorf("usuario.registrar: %d eventos, quería 1", n)
	}

	reporte := ciudadano.crearReporte()
	if n := contarHistorial(t, "reporte.crear", "reporte", reporte.Id.String()); n != 1 {
		t.Errorf("reporte.crear: %d eventos, quería 1", n)
	}

	rec := ciudadano.expect(http.StatusCreated, http.MethodPost, "/v1/reportes/"+reporte.Id.String()+"/comentarios", map[string]any{
		"comentario": "Sigue ahí",
	})
	comentario := decode[httpapi.Comentario](t, rec)
	if n := contarHistorial(t, "comentario.crear", "comentario", strconv.Itoa(comentario.Id)); n != 1 {
		t.Errorf("comentario.crear: %d eventos, quería 1", n)
	}

	admin := newTestClient(t)
	admin.loginComo("admin")
	adminID := admin.usuarioActual()

	t.Run("cambiar estado guarda el estado anterior y el nuevo", func(t *testing.T) {
		admin.expect(http.StatusOK, http.MethodPatch, "/v1/reportes/"+reporte.Id.String()+"/estado", map[string]any{"estado": "Verificado"})

		ev := ultimoHistorial(t, "reporte", reporte.Id.String())
		if ev.Accion != "reporte.cambiar_estado" || ev.ActorID == nil || *ev.ActorID != adminID {
			t.Fatalf("evento = %+v, quería reporte.cambiar_estado del admin %v", ev, adminID)
		}
		var datos map[string]string
		if err := json.Unmarshal(ev.Datos, &datos); err != nil {
			t.Fatalf("datos = %s: %v", ev.Datos, err)
		}
		if datos["de"] != string(reporte.EstadoActual) || datos["a"] != "Verificado" {
			t.Errorf("datos = %v, quería de=%q a=Verificado", datos, reporte.EstadoActual)
		}
	})

	t.Run("incidente y tags", func(t *testing.T) {
		admin.t = t
		inc := admin.crearIncidente(map[string]any{"nombre": nombreIncidente()})
		id := strconv.Itoa(inc.Id)
		if n := contarHistorial(t, "incidente.crear", "incidente", id); n != 1 {
			t.Errorf("incidente.crear: %d eventos, quería 1", n)
		}

		admin.expect(http.StatusCreated, http.MethodPost, fmt.Sprintf("/v1/incidentes/%d/tags", inc.Id), []map[string]any{{"nombre": "ancho"}})
		ev := ultimoHistorial(t, "incidente", id)
		if ev.Accion != "incidente.agregar_tags" || ev.ActorID == nil || *ev.ActorID != adminID {
			t.Fatalf("evento = %+v, quería incidente.agregar_tags del admin %v", ev, adminID)
		}
	})
}

// assertIncidenteDiff verifica que el evento de historial de una actualización
// de incidente contenga exactamente los campos indicados en want, cada uno con
// su valor anterior y posterior. Si want está vacío, exige Datos == nil.
func assertIncidenteDiff(t *testing.T, ev sqlc.Historial, want map[string][2]any) {
	t.Helper()
	if ev.Accion != "incidente.actualizar" {
		t.Fatalf("evento = %+v, quería accion incidente.actualizar", ev)
	}
	if len(want) == 0 {
		if len(ev.Datos) != 0 {
			t.Fatalf("datos = %s, quería NULL/vacío (sin cambios)", ev.Datos)
		}
		return
	}
	var datos map[string]map[string]any
	if err := json.Unmarshal(ev.Datos, &datos); err != nil {
		t.Fatalf("datos = %s: %v", ev.Datos, err)
	}
	if len(datos) != len(want) {
		t.Fatalf("datos = %v, quería %d campos, got %d", datos, len(want), len(datos))
	}
	for campo, vals := range want {
		d, ok := datos[campo]
		if !ok {
			t.Fatalf("datos = %v, falta el campo %q", datos, campo)
		}
		if d["antes"] != vals[0] || d["despues"] != vals[1] {
			t.Fatalf("campo %q = %v, quería antes=%v despues=%v", campo, d, vals[0], vals[1])
		}
	}
}

func TestHistorialIncidenteActualizar(t *testing.T) {
	admin := newTestClient(t)
	admin.loginComo("admin")
	adminID := admin.usuarioActual()

	t.Run("solo color", func(t *testing.T) {
		tc := *admin
		tc.t = t
		inc := tc.crearIncidente(map[string]any{
			"nombre": nombreIncidente(), "color": "#757575", "esta_activo": true,
		})
		id := strconv.Itoa(inc.Id)
		tc.expect(http.StatusOK, http.MethodPut, "/v1/incidentes/"+id, map[string]any{
			"nombre": inc.Nombre, "etiqueta": inc.Etiqueta, "color": "#EF6C33",
			"esta_activo": inc.EstaActivo, "tiempo_limite": inc.TiempoLimite, "radio": inc.Radio,
		})
		ev := ultimoHistorial(t, "incidente", id)
		if ev.ActorID == nil || *ev.ActorID != adminID {
			t.Fatalf("actor = %v, quería %v", ev.ActorID, adminID)
		}
		assertIncidenteDiff(t, ev, map[string][2]any{
			"color": {"#757575", "#EF6C33"},
		})
	})

	t.Run("solo nombre", func(t *testing.T) {
		tc := *admin
		tc.t = t
		inc := tc.crearIncidente(map[string]any{
			"nombre": nombreIncidente(), "color": "#757575", "esta_activo": true,
		})
		id := strconv.Itoa(inc.Id)
		nuevoNombre := nombreIncidente()
		tc.expect(http.StatusOK, http.MethodPut, "/v1/incidentes/"+id, map[string]any{
			"nombre": nuevoNombre, "etiqueta": inc.Etiqueta, "color": inc.Color,
			"esta_activo": inc.EstaActivo, "tiempo_limite": inc.TiempoLimite, "radio": inc.Radio,
		})
		ev := ultimoHistorial(t, "incidente", id)
		assertIncidenteDiff(t, ev, map[string][2]any{
			"nombre": {inc.Nombre, nuevoNombre},
		})
	})

	t.Run("solo etiqueta", func(t *testing.T) {
		tc := *admin
		tc.t = t
		inc := tc.crearIncidente(map[string]any{
			"nombre": nombreIncidente(), "etiqueta": "Vieja", "color": "#757575", "esta_activo": true,
		})
		id := strconv.Itoa(inc.Id)
		tc.expect(http.StatusOK, http.MethodPut, "/v1/incidentes/"+id, map[string]any{
			"nombre": inc.Nombre, "etiqueta": "Nueva", "color": inc.Color,
			"esta_activo": inc.EstaActivo, "tiempo_limite": inc.TiempoLimite, "radio": inc.Radio,
		})
		ev := ultimoHistorial(t, "incidente", id)
		assertIncidenteDiff(t, ev, map[string][2]any{
			"etiqueta": {"Vieja", "Nueva"},
		})
	})

	t.Run("solo esta_activo", func(t *testing.T) {
		tc := *admin
		tc.t = t
		inc := tc.crearIncidente(map[string]any{
			"nombre": nombreIncidente(), "color": "#757575", "esta_activo": true,
		})
		id := strconv.Itoa(inc.Id)
		tc.expect(http.StatusOK, http.MethodPut, "/v1/incidentes/"+id, map[string]any{
			"nombre": inc.Nombre, "etiqueta": inc.Etiqueta, "color": inc.Color,
			"esta_activo": false, "tiempo_limite": inc.TiempoLimite, "radio": inc.Radio,
		})
		ev := ultimoHistorial(t, "incidente", id)
		assertIncidenteDiff(t, ev, map[string][2]any{
			"esta_activo": {true, false},
		})
	})

	t.Run("varios campos a la vez", func(t *testing.T) {
		tc := *admin
		tc.t = t
		inc := tc.crearIncidente(map[string]any{
			"nombre": nombreIncidente(), "color": "#757575", "esta_activo": true,
			"tiempo_limite": 7, "radio": 25.5,
		})
		id := strconv.Itoa(inc.Id)
		tc.expect(http.StatusOK, http.MethodPut, "/v1/incidentes/"+id, map[string]any{
			"nombre": inc.Nombre, "etiqueta": inc.Etiqueta, "color": "#ABCDEF",
			"esta_activo": false, "tiempo_limite": 10, "radio": 5.5,
		})
		ev := ultimoHistorial(t, "incidente", id)
		assertIncidenteDiff(t, ev, map[string][2]any{
			"color":         {"#757575", "#ABCDEF"},
			"esta_activo":   {true, false},
			"tiempo_limite": {float64(7), float64(10)},
			"radio":         {25.5, 5.5},
		})
	})

	t.Run("tiempo_limite nil a valor", func(t *testing.T) {
		tc := *admin
		tc.t = t
		inc := tc.crearIncidente(map[string]any{
			"nombre": nombreIncidente(), "color": "#757575", "esta_activo": true,
		})
		id := strconv.Itoa(inc.Id)
		tc.expect(http.StatusOK, http.MethodPut, "/v1/incidentes/"+id, map[string]any{
			"nombre": inc.Nombre, "etiqueta": inc.Etiqueta, "color": inc.Color,
			"esta_activo": inc.EstaActivo, "tiempo_limite": 5, "radio": inc.Radio,
		})
		ev := ultimoHistorial(t, "incidente", id)
		assertIncidenteDiff(t, ev, map[string][2]any{
			"tiempo_limite": {nil, float64(5)},
		})
	})

	t.Run("tiempo_limite valor a nil", func(t *testing.T) {
		tc := *admin
		tc.t = t
		inc := tc.crearIncidente(map[string]any{
			"nombre": nombreIncidente(), "color": "#757575", "esta_activo": true,
			"tiempo_limite": 5,
		})
		id := strconv.Itoa(inc.Id)
		tc.expect(http.StatusOK, http.MethodPut, "/v1/incidentes/"+id, map[string]any{
			"nombre": inc.Nombre, "etiqueta": inc.Etiqueta, "color": inc.Color,
			"esta_activo": inc.EstaActivo, "tiempo_limite": nil, "radio": inc.Radio,
		})
		ev := ultimoHistorial(t, "incidente", id)
		assertIncidenteDiff(t, ev, map[string][2]any{
			"tiempo_limite": {float64(5), nil},
		})
	})

	t.Run("radio nil a valor", func(t *testing.T) {
		tc := *admin
		tc.t = t
		inc := tc.crearIncidente(map[string]any{
			"nombre": nombreIncidente(), "color": "#757575", "esta_activo": true,
		})
		id := strconv.Itoa(inc.Id)
		tc.expect(http.StatusOK, http.MethodPut, "/v1/incidentes/"+id, map[string]any{
			"nombre": inc.Nombre, "etiqueta": inc.Etiqueta, "color": inc.Color,
			"esta_activo": inc.EstaActivo, "tiempo_limite": inc.TiempoLimite, "radio": 3.5,
		})
		ev := ultimoHistorial(t, "incidente", id)
		assertIncidenteDiff(t, ev, map[string][2]any{
			"radio": {nil, 3.5},
		})
	})

	t.Run("sin cambios", func(t *testing.T) {
		tc := *admin
		tc.t = t
		inc := tc.crearIncidente(map[string]any{
			"nombre": nombreIncidente(), "color": "#757575", "esta_activo": true,
			"tiempo_limite": 7, "radio": 25.5,
		})
		id := strconv.Itoa(inc.Id)
		tc.expect(http.StatusOK, http.MethodPut, "/v1/incidentes/"+id, map[string]any{
			"nombre": inc.Nombre, "etiqueta": inc.Etiqueta, "color": inc.Color,
			"esta_activo": inc.EstaActivo, "tiempo_limite": inc.TiempoLimite, "radio": inc.Radio,
		})
		ev := ultimoHistorial(t, "incidente", id)
		assertIncidenteDiff(t, ev, nil)
	})
}
