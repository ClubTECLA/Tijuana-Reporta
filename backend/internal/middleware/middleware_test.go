package middleware

import (
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

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
