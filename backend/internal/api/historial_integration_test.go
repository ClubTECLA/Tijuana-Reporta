package api_test

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"testing"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/api"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/database"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/domain"
	"github.com/google/uuid"
)

// crearActor registra un usuario directo en la store y devuelve su id, para
// los tests que llaman a la store sin pasar por la API: actor_id del
// historial es FK a users, así que no sirve un uuid inventado.
func crearActor(t *testing.T, store *database.Store) uuid.UUID {
	t.Helper()

	rol, err := store.GetDefaultRole(t.Context())
	if err != nil {
		t.Fatalf("obteniendo rol por defecto: %v", err)
	}
	email, _ := credenciales()
	u, err := store.CreateUserWithLocalProvider(t.Context(), domain.CreateUserParams{
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
func ultimoHistorial(t *testing.T, entidad, entidadID string) domain.Historial {
	t.Helper()

	eventos, err := database.NewStore(testPool(t)).ListHistorialPorEntidad(t.Context(), domain.ListHistorialPorEntidadParams{
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

	return decode[api.UsuarioMeResponse](c.t, c.expect(http.StatusOK, http.MethodGet, "/v1/auth/me", nil)).Id
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
	comentario := decode[api.Comentario](t, rec)
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
