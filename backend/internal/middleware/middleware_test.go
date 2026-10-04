package middleware

import (
	"net/http"
	"net/http/httptest"
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
