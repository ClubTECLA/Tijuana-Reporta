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
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/domain"
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
		Incidentes:  service.NewIncidenteService(store),
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

// loginComo registra un usuario, le asigna el rol dado directo en la base y
// luego inicia sesión, para que el token ya lleve ese rol.
func (c *testClient) loginComo(rol string) {
	c.t.Helper()

	email, password := credenciales()
	c.expect(http.StatusCreated, http.MethodPost, "/v1/auth/register", map[string]any{
		"email": email, "username": "tester", "password": password,
	})

	_, err := testPool(c.t).Exec(c.t.Context(),
		`UPDATE users SET rol_id = (SELECT id FROM roles WHERE nombre = $1) WHERE email = $2`,
		rol, email)
	if err != nil {
		c.t.Fatalf("asignando rol %q: %v", rol, err)
	}

	rec := c.expect(http.StatusOK, http.MethodPost, "/v1/auth/login", map[string]any{
		"email": email, "password": password,
	})
	c.token = decode[api.AuthResponse](c.t, rec).AccessToken
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

// nombreIncidente devuelve un nombre único por llamada: incidentes.nombre es
// UNIQUE y la base se comparte entre tests y corridas.
func nombreIncidente() string {
	return "test-" + uuid.NewString()
}

func TestCrearIncidentePermisos(t *testing.T) {
	t.Run("sin token", func(t *testing.T) {
		c := newTestClient(t)
		c.expect(http.StatusUnauthorized, http.MethodPost, "/v1/incidentes", map[string]any{"nombre": nombreIncidente()})
	})

	t.Run("ciudadano", func(t *testing.T) {
		c := newTestClient(t)
		c.login()
		c.expect(http.StatusForbidden, http.MethodPost, "/v1/incidentes", map[string]any{"nombre": nombreIncidente()})
	})

	t.Run("admin", func(t *testing.T) {
		c := newTestClient(t)
		c.loginComo("admin")
		c.expect(http.StatusCreated, http.MethodPost, "/v1/incidentes", map[string]any{"nombre": nombreIncidente()})
	})
}

func TestCrearIncidente(t *testing.T) {
	c := newTestClient(t)
	c.loginComo("admin")

	t.Run("con tags", func(t *testing.T) {
		tc := *c
		tc.t = t
		nombre := nombreIncidente()

		rec := tc.expect(http.StatusCreated, http.MethodPost, "/v1/incidentes", map[string]any{
			"nombre":        nombre,
			"color":         "#EF6C33",
			"esta_activo":   false,
			"tiempo_limite": 7,
			"radio":         25.5,
			"tags": []map[string]any{
				{"nombre": "profundo", "peso": 3},
				{"nombre": "ancho"},
				{"nombre": "con agua"},
			},
		})
		inc := decode[api.Incidente](t, rec)

		if inc.Id == 0 || inc.Nombre != nombre || inc.Color != "#EF6C33" || inc.EstaActivo {
			t.Errorf("incidente = %+v, quería nombre=%q color=#EF6C33 esta_activo=false", inc, nombre)
		}
		if inc.TiempoLimite == nil || *inc.TiempoLimite != 7 || inc.Radio == nil || *inc.Radio != 25.5 {
			t.Errorf("tiempo_limite/radio = %v/%v, quería 7/25.5", inc.TiempoLimite, inc.Radio)
		}

		want := []struct {
			nombre string
			peso   int
		}{{"profundo", 3}, {"ancho", 1}, {"con agua", 1}}
		if len(inc.Tags) != len(want) {
			t.Fatalf("tags = %+v, quería %d", inc.Tags, len(want))
		}
		for i, w := range want {
			got := inc.Tags[i]
			if got.Id == 0 || got.Nombre != w.nombre || got.Peso != w.peso {
				t.Errorf("tags[%d] = %+v, quería nombre=%q peso=%d y un id", i, got, w.nombre, w.peso)
			}
		}
	})

	t.Run("valores por defecto", func(t *testing.T) {
		tc := *c
		tc.t = t

		rec := tc.expect(http.StatusCreated, http.MethodPost, "/v1/incidentes", map[string]any{"nombre": nombreIncidente()})
		inc := decode[api.Incidente](t, rec)

		if inc.Color != "#757575" || !inc.EstaActivo || inc.TiempoLimite != nil || inc.Radio != nil {
			t.Errorf("incidente = %+v, quería color=#757575 esta_activo=true y tiempo_limite/radio nulos", inc)
		}
		// El contrato pide un arreglo: null rompería a los clientes generados.
		if inc.Tags == nil || len(inc.Tags) != 0 {
			t.Errorf("tags = %#v, quería [] (no null)", inc.Tags)
		}
	})

	t.Run("nombre repetido", func(t *testing.T) {
		tc := *c
		tc.t = t
		body := map[string]any{"nombre": nombreIncidente()}

		tc.expect(http.StatusCreated, http.MethodPost, "/v1/incidentes", body)
		tc.expect(http.StatusConflict, http.MethodPost, "/v1/incidentes", body)
	})

	t.Run("nombre de un incidente sembrado", func(t *testing.T) {
		tc := *c
		tc.t = t
		tc.expect(http.StatusConflict, http.MethodPost, "/v1/incidentes", map[string]any{"nombre": "socavon"})
	})

	invalidos := []struct {
		name string
		body map[string]any
	}{
		{name: "nombre vacío", body: map[string]any{"nombre": "  "}},
		{name: "color inválido", body: map[string]any{"color": "red"}},
		{name: "tiempo_limite negativo", body: map[string]any{"tiempo_limite": -1}},
		{name: "radio negativo", body: map[string]any{"radio": -2.5}},
		{name: "peso 0", body: map[string]any{"tags": []map[string]any{{"nombre": "luz", "peso": 0}}}},
		{name: "tags repetidos", body: map[string]any{"tags": []map[string]any{{"nombre": "luz"}, {"nombre": "Luz"}}}},
	}
	for _, tt := range invalidos {
		t.Run(tt.name, func(t *testing.T) {
			tc := *c
			tc.t = t
			nombre := nombreIncidente()

			body := map[string]any{"nombre": nombre}
			for k, v := range tt.body {
				body[k] = v
			}
			tc.expect(http.StatusBadRequest, http.MethodPost, "/v1/incidentes", body)

			// Nada quedó creado: el mismo nombre, ya válido, se puede usar.
			if _, ok := tt.body["nombre"]; !ok {
				tc.expect(http.StatusCreated, http.MethodPost, "/v1/incidentes", map[string]any{"nombre": nombre})
			}
		})
	}
}

// TestCreateIncidenteConTagsRollback prueba la transacción del store
// directamente: el servicio ya rechaza los tags repetidos, así que por la API
// no hay forma de que falle un tag después de insertar el incidente.
func TestCreateIncidenteConTagsRollback(t *testing.T) {
	pool := testPool(t)
	store := database.NewStore(pool)
	nombre := nombreIncidente()

	_, err := store.CreateIncidenteConTags(t.Context(), domain.CreateIncidenteTxParams{
		Incidente: domain.CreateIncidenteParams{Nombre: nombre, Color: "#757575", EstaActivo: true},
		Tags:      []domain.CreateTagParams{{Nombre: "luz", Peso: 1}, {Nombre: "luz", Peso: 1}},
	})
	if !domain.IsUniqueViolation(err) {
		t.Fatalf("CreateIncidenteConTags() error = %v, quería un UNIQUE roto por el tag repetido", err)
	}

	var n int
	if err := pool.QueryRow(t.Context(), "SELECT count(*) FROM incidentes WHERE nombre = $1", nombre).Scan(&n); err != nil {
		t.Fatalf("contando incidentes: %v", err)
	}
	if n != 0 {
		t.Errorf("quedaron %d incidentes %q tras el rollback, quería 0", n, nombre)
	}
}

// crearIncidente crea un incidente con el cliente (que debe ser admin) y lo
// devuelve.
func (c *testClient) crearIncidente(body map[string]any) api.Incidente {
	c.t.Helper()

	rec := c.expect(http.StatusCreated, http.MethodPost, "/v1/incidentes", body)
	return decode[api.Incidente](c.t, rec)
}

// nombresDeTags devuelve los nombres de los tags, en orden.
func nombresDeTags(tags []api.TagCatalogo) []string {
	nombres := make([]string, 0, len(tags))
	for _, t := range tags {
		nombres = append(nombres, t.Nombre)
	}
	return nombres
}

func TestListarIncidentes(t *testing.T) {
	admin := newTestClient(t)
	admin.loginComo("admin")
	activo := admin.crearIncidente(map[string]any{
		"nombre": nombreIncidente(),
		"tags":   []map[string]any{{"nombre": "profundo"}, {"nombre": "ancho"}},
	})
	inactivo := admin.crearIncidente(map[string]any{"nombre": nombreIncidente(), "esta_activo": false})

	// Listar no es solo para admins: cualquier usuario autenticado puede.
	c := newTestClient(t)
	c.login()

	buscar := func(is []api.Incidente, id int) (api.Incidente, bool) {
		i := slices.IndexFunc(is, func(i api.Incidente) bool { return i.Id == id })
		if i < 0 {
			return api.Incidente{}, false
		}
		return is[i], true
	}

	t.Run("solo activos", func(t *testing.T) {
		tc := *c
		tc.t = t
		is := decode[[]api.Incidente](t, tc.expect(http.StatusOK, http.MethodGet, "/v1/incidentes", nil))

		got, ok := buscar(is, activo.Id)
		if !ok {
			t.Fatalf("el listado no incluye el incidente activo %d", activo.Id)
		}
		if !slices.Equal(nombresDeTags(got.Tags), []string{"profundo", "ancho"}) {
			t.Errorf("tags = %v, quería [profundo ancho]", nombresDeTags(got.Tags))
		}
		if _, ok := buscar(is, inactivo.Id); ok {
			t.Errorf("el listado incluye el incidente inactivo %d", inactivo.Id)
		}
		if _, ok := buscar(is, incidenteSocavon); !ok {
			t.Errorf("el listado no incluye los incidentes sembrados")
		}
		for _, i := range is {
			if i.Tags == nil {
				t.Errorf("incidente %d: tags = null, quería []", i.Id)
			}
		}
	})

	t.Run("incluir inactivos", func(t *testing.T) {
		tc := *c
		tc.t = t
		is := decode[[]api.Incidente](t, tc.expect(http.StatusOK, http.MethodGet, "/v1/incidentes?incluir_inactivos=true", nil))

		if _, ok := buscar(is, inactivo.Id); !ok {
			t.Errorf("el listado no incluye el incidente inactivo %d", inactivo.Id)
		}
	})

	t.Run("sin token", func(t *testing.T) {
		tc := *c
		tc.t = t
		tc.token = ""
		tc.expect(http.StatusUnauthorized, http.MethodGet, "/v1/incidentes", nil)
	})
}

func TestObtenerIncidente(t *testing.T) {
	c := newTestClient(t)
	c.loginComo("admin")
	creado := c.crearIncidente(map[string]any{
		"nombre":      nombreIncidente(),
		"esta_activo": false,
		"tags":        []map[string]any{{"nombre": "profundo", "peso": 2}},
	})

	t.Run("existente, aunque esté inactivo", func(t *testing.T) {
		tc := *c
		tc.t = t
		got := decode[api.Incidente](t, tc.expect(http.StatusOK, http.MethodGet, fmt.Sprintf("/v1/incidentes/%d", creado.Id), nil))

		if got.Id != creado.Id || got.Nombre != creado.Nombre || got.EstaActivo {
			t.Errorf("incidente = %+v, quería id=%d nombre=%q inactivo", got, creado.Id, creado.Nombre)
		}
		if len(got.Tags) != 1 || got.Tags[0].Nombre != "profundo" || got.Tags[0].Peso != 2 {
			t.Errorf("tags = %+v, quería [profundo (peso 2)]", got.Tags)
		}
	})

	t.Run("inexistente", func(t *testing.T) {
		tc := *c
		tc.t = t
		tc.expect(http.StatusNotFound, http.MethodGet, "/v1/incidentes/999999", nil)
	})

	t.Run("id que no es número", func(t *testing.T) {
		tc := *c
		tc.t = t
		tc.expect(http.StatusBadRequest, http.MethodGet, "/v1/incidentes/abc", nil)
	})
}

func TestAgregarTags(t *testing.T) {
	c := newTestClient(t)
	c.loginComo("admin")

	t.Run("agrega y los devuelve en orden", func(t *testing.T) {
		tc := *c
		tc.t = t
		inc := tc.crearIncidente(map[string]any{"nombre": nombreIncidente(), "tags": []map[string]any{{"nombre": "profundo"}}})
		path := fmt.Sprintf("/v1/incidentes/%d/tags", inc.Id)

		rec := tc.expect(http.StatusCreated, http.MethodPost, path, []map[string]any{
			{"nombre": "ancho"}, {"nombre": "con agua", "peso": 3},
		})
		tags := decode[[]api.TagCatalogo](t, rec)
		if len(tags) != 2 || tags[0].Id == 0 || tags[0].Nombre != "ancho" || tags[0].Peso != 1 || tags[1].Peso != 3 {
			t.Errorf("tags = %+v, quería [ancho (peso 1), con agua (peso 3)] con ids", tags)
		}

		got := decode[api.Incidente](t, tc.expect(http.StatusOK, http.MethodGet, fmt.Sprintf("/v1/incidentes/%d", inc.Id), nil))
		if !slices.Equal(nombresDeTags(got.Tags), []string{"profundo", "ancho", "con agua"}) {
			t.Errorf("tags del incidente = %v, quería [profundo ancho con agua]", nombresDeTags(got.Tags))
		}
	})

	t.Run("todo o nada", func(t *testing.T) {
		tc := *c
		tc.t = t
		inc := tc.crearIncidente(map[string]any{"nombre": nombreIncidente(), "tags": []map[string]any{{"nombre": "profundo"}}})
		path := fmt.Sprintf("/v1/incidentes/%d/tags", inc.Id)

		// "nuevo" es válido, pero "PROFUNDO" ya existe: no se crea ninguno.
		tc.expect(http.StatusConflict, http.MethodPost, path, []map[string]any{{"nombre": "nuevo"}, {"nombre": "PROFUNDO"}})

		got := decode[api.Incidente](t, tc.expect(http.StatusOK, http.MethodGet, fmt.Sprintf("/v1/incidentes/%d", inc.Id), nil))
		if !slices.Equal(nombresDeTags(got.Tags), []string{"profundo"}) {
			t.Errorf("tags del incidente = %v, quería [profundo]", nombresDeTags(got.Tags))
		}
	})

	inc := c.crearIncidente(map[string]any{"nombre": nombreIncidente()})
	path := fmt.Sprintf("/v1/incidentes/%d/tags", inc.Id)

	errores := []struct {
		name string
		path string
		body any
		want int
	}{
		{name: "sin tags", path: path, body: []map[string]any{}, want: http.StatusBadRequest},
		{name: "repetidos en la petición", path: path, body: []map[string]any{{"nombre": "a"}, {"nombre": "A"}}, want: http.StatusBadRequest},
		{name: "peso 0", path: path, body: []map[string]any{{"nombre": "a", "peso": 0}}, want: http.StatusBadRequest},
		{name: "incidente inexistente", path: "/v1/incidentes/999999/tags", body: []map[string]any{{"nombre": "a"}}, want: http.StatusNotFound},
	}
	for _, tt := range errores {
		t.Run(tt.name, func(t *testing.T) {
			tc := *c
			tc.t = t
			tc.expect(tt.want, http.MethodPost, tt.path, tt.body)
		})
	}

	t.Run("ciudadano", func(t *testing.T) {
		ciudadano := newTestClient(t)
		ciudadano.login()
		ciudadano.expect(http.StatusForbidden, http.MethodPost, path, []map[string]any{{"nombre": "a"}})
	})
}

// TestCreateTags prueba la transacción y los errores del store directamente:
// por la API, el servicio rechaza antes los repetidos y los incidentes que no
// existen, así que solo llegan a la base en una carrera.
func TestCreateTags(t *testing.T) {
	pool := testPool(t)
	store := database.NewStore(pool)

	t.Run("rollback si uno falla", func(t *testing.T) {
		d, err := store.CreateIncidenteConTags(t.Context(), domain.CreateIncidenteTxParams{
			Incidente: domain.CreateIncidenteParams{Nombre: nombreIncidente(), Color: "#757575", EstaActivo: true},
		})
		if err != nil {
			t.Fatalf("CreateIncidenteConTags() error = %v", err)
		}
		id := d.Incidente.ID

		_, err = store.CreateTags(t.Context(), []domain.CreateTagParams{
			{IncidenteID: id, Nombre: "nuevo", Peso: 1},
			{IncidenteID: id, Nombre: "nuevo", Peso: 1},
		})
		if !domain.IsUniqueViolation(err) {
			t.Fatalf("CreateTags() error = %v, quería un UNIQUE roto por el tag repetido", err)
		}

		var n int
		if err := pool.QueryRow(t.Context(), "SELECT count(*) FROM tags WHERE incidente_id = $1", id).Scan(&n); err != nil {
			t.Fatalf("contando tags: %v", err)
		}
		if n != 0 {
			t.Errorf("quedaron %d tags tras el rollback, quería 0", n)
		}
	})

	// El servicio traduce este FOREIGN KEY por nombre a ErrIncidenteNotFound.
	t.Run("incidente inexistente", func(t *testing.T) {
		_, err := store.CreateTags(t.Context(), []domain.CreateTagParams{{IncidenteID: 999999, Nombre: "a", Peso: 1}})
		if !domain.IsForeignKeyViolation(err, "tags_incidente_id_fkey") {
			t.Fatalf("CreateTags() error = %v, quería el FOREIGN KEY tags_incidente_id_fkey", err)
		}
	})
}
