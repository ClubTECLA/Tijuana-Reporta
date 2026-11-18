package middleware

import (
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
)

func TestRequireRole(t *testing.T) {
	gin.SetMode(gin.TestMode)
	const scopesKey = "scopes"

	tests := []struct {
		name   string
		scopes []string // nil = la ruta no declara security
		rol    string
		want   int
	}{
		{name: "ruta sin scopes", scopes: nil, rol: "ciudadano", want: http.StatusOK},
		{name: "scopes vacíos, solo autenticado", scopes: []string{}, rol: "ciudadano", want: http.StatusOK},
		{name: "admin en ruta admin", scopes: []string{"admin"}, rol: "admin", want: http.StatusOK},
		{name: "ciudadano en ruta admin", scopes: []string{"admin"}, rol: "ciudadano", want: http.StatusForbidden},
		{name: "token sin rol en ruta admin", scopes: []string{"admin"}, rol: "", want: http.StatusForbidden},
		{name: "uno de varios roles", scopes: []string{"admin", "moderador"}, rol: "moderador", want: http.StatusOK},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			rec := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(rec)
			c.Request = httptest.NewRequest(http.MethodGet, "/", nil)
			if tt.scopes != nil {
				c.Set(scopesKey, tt.scopes)
			}
			if tt.rol != "" {
				c.Request = c.Request.WithContext(ContextWithRol(c.Request.Context(), tt.rol))
			}

			RequireRole(scopesKey)(c)

			if rec.Code != tt.want {
				t.Errorf("status = %d, quería %d", rec.Code, tt.want)
			}
		})
	}
}

func TestBodyLimit(t *testing.T) {
	gin.SetMode(gin.TestMode)
	const limit = 10

	tests := []struct {
		name    string
		body    string
		chunked bool // sin Content-Length, como en Transfer-Encoding: chunked
		want    int
	}{
		{name: "dentro del límite", body: "0123456789", want: http.StatusOK},
		{name: "excede el límite", body: "0123456789x", want: http.StatusRequestEntityTooLarge},
		{name: "excede sin Content-Length", body: "0123456789x", chunked: true, want: http.StatusRequestEntityTooLarge},
		{name: "sin body", body: "", want: http.StatusOK},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			r := gin.New()
			var got string
			r.POST("/", BodyLimit(limit), func(c *gin.Context) {
				b, _ := io.ReadAll(c.Request.Body)
				got = string(b)
				c.Status(http.StatusOK)
			})

			req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(tt.body))
			if tt.chunked {
				req.ContentLength = -1
			}
			rec := httptest.NewRecorder()
			r.ServeHTTP(rec, req)

			if rec.Code != tt.want {
				t.Fatalf("status = %d, want %d", rec.Code, tt.want)
			}
			if tt.want == http.StatusOK && got != tt.body {
				t.Errorf("body que llegó al handler = %q, want %q", got, tt.body)
			}
		})
	}
}

func TestBodyLimitFunc_ElLimiteDependeDeLaRuta(t *testing.T) {
	gin.SetMode(gin.TestMode)

	r := gin.New()
	limite := func(c *gin.Context) int64 {
		if c.FullPath() == "/grande" {
			return 100
		}
		return 10
	}
	manejador := func(c *gin.Context) { c.Status(http.StatusOK) }
	r.POST("/chico", BodyLimitFunc(limite), manejador)
	r.POST("/grande", BodyLimitFunc(limite), manejador)

	tests := []struct {
		name string
		path string
		body string
		want int
	}{
		{name: "ruta chica dentro del límite", path: "/chico", body: strings.Repeat("a", 10), want: http.StatusOK},
		{name: "ruta chica excedida", path: "/chico", body: strings.Repeat("a", 11), want: http.StatusRequestEntityTooLarge},
		{name: "ruta grande acepta más que la chica", path: "/grande", body: strings.Repeat("a", 100), want: http.StatusOK},
		{name: "ruta grande excedida", path: "/grande", body: strings.Repeat("a", 101), want: http.StatusRequestEntityTooLarge},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			rec := httptest.NewRecorder()
			r.ServeHTTP(rec, httptest.NewRequest(http.MethodPost, tt.path, strings.NewReader(tt.body)))

			if rec.Code != tt.want {
				t.Errorf("POST %s con %d bytes status = %d, want %d", tt.path, len(tt.body), rec.Code, tt.want)
			}
		})
	}
}

func TestTokenAnteriorAlCambio(t *testing.T) {
	anterior := time.Date(2026, 11, 14, 9, 0, 0, 123_456_000, time.UTC)
	cambio := time.Date(2026, 11, 14, 10, 0, 5, 700_000_000, time.UTC) // 10:00:05.7
	tests := []struct {
		name      string
		pwdAt     string
		changedAt *time.Time
		want      bool
	}{
		{"nunca cambió, token sin claim", "", nil, false},
		// Login posterior al reset: leyó el password_changed_at nuevo.
		{"firmado con la versión actual", VersionCredencial(&cambio), &cambio, false},
		// Token sin claim (o de un Login que leyó el hash antes del primer
		// reset) después de un cambio.
		{"sin claim tras un cambio", "", &cambio, true},
		// Login que validó el hash viejo y firmó después de un reset
		// concurrente: su iat sería posterior, pero la versión es la vieja.
		{"firmado con la versión anterior", VersionCredencial(&anterior), &cambio, true},
		{"claim con usuario que nunca cambió", VersionCredencial(&cambio), nil, true},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := tokenAnteriorAlCambio(tt.pwdAt, tt.changedAt); got != tt.want {
				t.Errorf("tokenAnteriorAlCambio() = %v, se esperaba %v", got, tt.want)
			}
		})
	}
}

func TestRateLimitPorIP_LimitaSoloLasRutasDadasPorIP(t *testing.T) {
	gin.SetMode(gin.TestMode)

	r := gin.New()
	limite := RateLimitPorIP(RateLimitRafaga, "/limitada")
	manejador := func(c *gin.Context) { c.Status(http.StatusOK) }
	r.POST("/limitada", limite, manejador)
	r.POST("/libre", limite, manejador)

	post := func(path, ip string) int {
		req := httptest.NewRequest(http.MethodPost, path, nil)
		req.RemoteAddr = ip + ":1234"
		rec := httptest.NewRecorder()
		r.ServeHTTP(rec, req)
		return rec.Code
	}

	for i := range RateLimitRafaga {
		if got := post("/limitada", "10.0.0.1"); got != http.StatusOK {
			t.Fatalf("petición %d dentro de la ráfaga: status = %d, want 200", i+1, got)
		}
	}
	if got := post("/limitada", "10.0.0.1"); got != http.StatusTooManyRequests {
		t.Errorf("petición después de la ráfaga: status = %d, want 429", got)
	}
	if got := post("/limitada", "10.0.0.2"); got != http.StatusOK {
		t.Errorf("otra IP: status = %d, want 200", got)
	}
	if got := post("/libre", "10.0.0.1"); got != http.StatusOK {
		t.Errorf("ruta sin límite: status = %d, want 200", got)
	}
}

func TestClaveRateLimit(t *testing.T) {
	tests := []struct {
		ip   string
		want string
	}{
		{"203.0.113.7", "203.0.113.7"},
		{"::ffff:203.0.113.7", "::ffff:203.0.113.7"},
		{"2001:db8:1:2:aaaa::1", "2001:db8:1:2::/64"},
		{"2001:db8:1:2:bbbb::9", "2001:db8:1:2::/64"}, // mismo /64, mismo bucket
		{"2001:db8:1:3::1", "2001:db8:1:3::/64"},
	}
	for _, tt := range tests {
		if got := claveRateLimit(tt.ip); got != tt.want {
			t.Errorf("claveRateLimit(%q) = %q, se esperaba %q", tt.ip, got, tt.want)
		}
	}
}
