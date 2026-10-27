package api

import (
	_ "embed"
	"net/http"

	"github.com/gin-gonic/gin"
)

//go:embed docs.html
var docsHTML []byte

// serveDocs muestra la documentación interactiva (Swagger UI) del contrato.
func serveDocs(c *gin.Context) {
	c.Data(http.StatusOK, "text/html; charset=utf-8", docsHTML)
}
