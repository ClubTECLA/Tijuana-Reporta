package httpapi

import (
	_ "embed"
	"net/http"

	"github.com/gin-gonic/gin"
)

//go:embed docs.html
var docsHTML []byte

// ServeDocs muestra la documentación interactiva (Swagger UI) del contrato.
func ServeDocs(c *gin.Context) {
	c.Data(http.StatusOK, "text/html; charset=utf-8", docsHTML)
}
