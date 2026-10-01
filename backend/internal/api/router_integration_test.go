package api_test

// Tests de integración: corren el router real (api.NewRouter) contra una base
// Postgres real, sin levantar el servidor HTTP. Reemplazan las pruebas manuales
// de cmd/http-tests/requests.http.
//
// Solo requieren Docker corriendo: la base la levanta testdb_test.go en un
// contenedor desechable. Se corren con `go test ./...` como cualquier otro test.
//
// Todos los tests comparten esa base, así que cada uno registra su propio
// usuario (email único) y crea sus propios reportes, para no depender del
// orden ni de lo que hayan creado los demás.

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"slices"
	"testing"
	"time"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/api"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/database"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

const testJWTSecret = "test-secret-de-al-menos-32-bytes!!"

// incidenteSocavon es uno de los incidentes que siembra
// 005_seed_incidentes (1 luz, 2 socavon, 3 arbol, 4 drenaje, 5 deslave).
const incidenteSocavon = 2

// testClient manda peticiones al router en memoria, con el token del usuario
// autenticado si lo hay.
type testClient struct {
	t      *testing.T
	router http.Handler
	token  string
}

// newTestClient arma el router con los servicios reales sobre la base de los
// tests, igual que cmd/api.
func newTestClient(t *testing.T) *testClient {
	t.Helper()

	store := database.NewStore(testPool(t))
	auth, err := service.NewAuthService(t.Context(), store, []byte(testJWTSecret), time.Hour)
	if err != nil {
		t.Fatalf("creando AuthService: %v", err)
	}

	gin.SetMode(gin.TestMode)
	router := api.NewRouter(api.Services{
		Comentarios: service.NewComentarioService(store),
		Reportes:    service.NewReporteService(store),
		Auth:        auth,
	}, testJWTSecret)

	return &testClient{t: t, router: router}
}

// do manda la petición y devuelve la respuesta grabada. body se serializa a
// JSON si no es nil.
func (c *testClient) do(method, path string, body any) *httptest.ResponseRecorder {
	c.t.Helper()

	var reader io.Reader
	if body != nil {
		b, err := json.Marshal(body)
		if err != nil {
			c.t.Fatalf("serializando body: %v", err)
		}
		reader = bytes.NewReader(b)
	}

	req := httptest.NewRequest(method, path, reader)
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	if c.token != "" {
		req.Header.Set("Authorization", "Bearer "+c.token)
	}

	rec := httptest.NewRecorder()
	c.router.ServeHTTP(rec, req)
	return rec
}

// expect manda la petición y falla el test si el status no es el esperado.
func (c *testClient) expect(want int, method, path string, body any) *httptest.ResponseRecorder {
	c.t.Helper()

	rec := c.do(method, path, body)
	if rec.Code != want {
		c.t.Fatalf("%s %s: status = %d, quería %d; body: %s", method, path, rec.Code, want, rec.Body)
	}
	return rec
}

// decode deserializa la respuesta en el tipo generado del contrato, así que
// si el contrato cambia y el test no, el test deja de compilar.
func decode[T any](t *testing.T, rec *httptest.ResponseRecorder) T {
	t.Helper()

	var v T
	if err := json.Unmarshal(rec.Body.Bytes(), &v); err != nil {
		t.Fatalf("deserializando respuesta: %v; body: %s", err, rec.Body)
	}
	return v
}

// credenciales devuelve un email único por llamada, para que los tests no
// choquen entre sí ni con corridas anteriores.
func credenciales() (email, password string) {
	return fmt.Sprintf("test-%s@example.com", uuid.NewString()), "password123"
}

// login registra un usuario nuevo e inicia sesión con él, dejando el token
// en el cliente.
func (c *testClient) login() api.AuthResponse {
	c.t.Helper()

	email, password := credenciales()
	c.expect(http.StatusCreated, http.MethodPost, "/v1/auth/register", map[string]any{
		"email": email, "username": "tester", "password": password,
	})

	rec := c.expect(http.StatusOK, http.MethodPost, "/v1/auth/login", map[string]any{
		"email": email, "password": password,
	})
	auth := decode[api.AuthResponse](c.t, rec)
	c.token = auth.AccessToken
	return auth
}

// crearReporte crea un reporte de socavón en el centro de Tijuana.
func (c *testClient) crearReporte() api.Reporte {
	c.t.Helper()

	rec := c.expect(http.StatusCreated, http.MethodPost, "/v1/reportes", map[string]any{
		"incidente_id": incidenteSocavon, "latitude": 32.5149, "longitude": -117.0382,
	})
	return decode[api.Reporte](c.t, rec)
}

// TestStatus cubre las peticiones donde solo importa el código de respuesta.
func TestStatus(t *testing.T) {
	c := newTestClient(t)
	c.login()

	tests := []struct {
		name   string
		method string
		path   string
		body   any
		noAuth bool
		want   int
	}{
		{name: "health", method: http.MethodGet, path: "/health", want: http.StatusOK},
		{name: "contrato OpenAPI", method: http.MethodGet, path: "/v1/openapi.json", want: http.StatusOK},
		{
			name: "login con contraseña incorrecta", method: http.MethodPost, path: "/v1/auth/login",
			body: map[string]any{"email": "nadie@example.com", "password": "incorrecta123"},
			want: http.StatusUnauthorized,
		},
		{name: "usuario actual sin token", method: http.MethodGet, path: "/v1/auth/me", noAuth: true, want: http.StatusUnauthorized},
		{
			name: "crear reporte con incidente inexistente", method: http.MethodPost, path: "/v1/reportes",
			body: map[string]any{"incidente_id": 999, "latitude": 32.5149, "longitude": -117.0382},
			want: http.StatusBadRequest,
		},
		{name: "obtener reporte inexistente", method: http.MethodGet, path: "/v1/reportes/" + uuid.Nil.String(), want: http.StatusNotFound},
		{name: "obtener reporte con id que no es UUID", method: http.MethodGet, path: "/v1/reportes/5", want: http.StatusBadRequest},
		{name: "listar con área incompleta", method: http.MethodGet, path: "/v1/reportes?min_lat=32.4", want: http.StatusBadRequest},
		{name: "avistamiento en reporte inexistente", method: http.MethodPatch, path: "/v1/reportes/" + uuid.Nil.String() + "/avistamientos", want: http.StatusNotFound},
		{name: "logout", method: http.MethodPost, path: "/v1/auth/logout", want: http.StatusNoContent},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tc := *c
			tc.t = t
			if tt.noAuth {
				tc.token = ""
			}
			tc.expect(tt.want, tt.method, tt.path, tt.body)
		})
	}
}

func TestRegistroEmailDuplicado(t *testing.T) {
	c := newTestClient(t)

	email, password := credenciales()
	body := map[string]any{"email": email, "username": "tester", "password": password}
	c.expect(http.StatusCreated, http.MethodPost, "/v1/auth/register", body)
	c.expect(http.StatusConflict, http.MethodPost, "/v1/auth/register", body)
}

func TestUsuarioActual(t *testing.T) {
	c := newTestClient(t)
	auth := c.login()

	rec := c.expect(http.StatusOK, http.MethodGet, "/v1/auth/me", nil)
	me := decode[api.UsuarioMeResponse](t, rec)

	if me.Id != auth.User.Id {
		t.Errorf("id = %v, quería %v", me.Id, auth.User.Id)
	}
	if me.Email != auth.User.Email {
		t.Errorf("email = %q, quería %q", me.Email, auth.User.Email)
	}
}

func TestCrearYObtenerReporte(t *testing.T) {
	c := newTestClient(t)
	c.login()

	creado := c.crearReporte()
	if creado.IncidenteId != incidenteSocavon {
		t.Errorf("incidente_id = %d, quería %d", creado.IncidenteId, incidenteSocavon)
	}

	rec := c.expect(http.StatusOK, http.MethodGet, "/v1/reportes/"+creado.Id.String(), nil)
	obtenido := decode[api.Reporte](t, rec)

	if obtenido.Id != creado.Id {
		t.Errorf("id = %v, quería %v", obtenido.Id, creado.Id)
	}
	if obtenido.Latitude != 32.5149 || obtenido.Longitude != -117.0382 {
		t.Errorf("ubicación = (%v, %v), quería (32.5149, -117.0382)", obtenido.Latitude, obtenido.Longitude)
	}
}

func TestListarReportes(t *testing.T) {
	c := newTestClient(t)
	c.login()
	creado := c.crearReporte()

	contiene := func(rs []api.ReporteResumen) bool {
		return slices.ContainsFunc(rs, func(r api.ReporteResumen) bool { return r.Id == creado.Id })
	}

	t.Run("sin filtro", func(t *testing.T) {
		tc := *c
		tc.t = t
		rec := tc.expect(http.StatusOK, http.MethodGet, "/v1/reportes", nil)
		if !contiene(decode[[]api.ReporteResumen](t, rec)) {
			t.Errorf("el listado no incluye el reporte %v", creado.Id)
		}
	})

	t.Run("área de Tijuana", func(t *testing.T) {
		tc := *c
		tc.t = t
		rec := tc.expect(http.StatusOK, http.MethodGet, "/v1/reportes?min_lat=32.4&max_lat=32.6&min_lng=-117.2&max_lng=-116.8", nil)
		if !contiene(decode[[]api.ReporteResumen](t, rec)) {
			t.Errorf("el listado del área no incluye el reporte %v", creado.Id)
		}
	})

	t.Run("área fuera de Tijuana", func(t *testing.T) {
		tc := *c
		tc.t = t
		rec := tc.expect(http.StatusOK, http.MethodGet, "/v1/reportes?min_lat=10&max_lat=11&min_lng=10&max_lng=11", nil)
		if contiene(decode[[]api.ReporteResumen](t, rec)) {
			t.Errorf("el listado de otra área incluye el reporte %v", creado.Id)
		}
	})
}

func TestComentarReporte(t *testing.T) {
	c := newTestClient(t)
	auth := c.login()
	reporte := c.crearReporte()

	rec := c.expect(http.StatusCreated, http.MethodPost, "/v1/reportes/"+reporte.Id.String()+"/comentarios", map[string]any{
		"comentario": "Sigue ahí el socavón",
	})
	comentario := decode[api.Comentario](t, rec)

	if comentario.Comentario != "Sigue ahí el socavón" {
		t.Errorf("comentario = %q", comentario.Comentario)
	}
	if comentario.ReporteId != reporte.Id {
		t.Errorf("reporte_id = %v, quería %v", comentario.ReporteId, reporte.Id)
	}
	if comentario.UserId != auth.User.Id {
		t.Errorf("user_id = %v, quería %v", comentario.UserId, auth.User.Id)
	}
}

func TestAgregarAvistamiento(t *testing.T) {
	c := newTestClient(t)
	c.login()
	reporte := c.crearReporte()

	rec := c.expect(http.StatusOK, http.MethodPatch, "/v1/reportes/"+reporte.Id.String()+"/avistamientos", nil)
	actualizado := decode[api.Reporte](t, rec)

	if actualizado.Avistamientos != reporte.Avistamientos+1 {
		t.Errorf("avistamientos = %d, quería %d", actualizado.Avistamientos, reporte.Avistamientos+1)
	}
}
