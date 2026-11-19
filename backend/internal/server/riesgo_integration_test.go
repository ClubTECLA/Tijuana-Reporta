package server_test

import (
	"net/http"
	"slices"
	"testing"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/httpapi"
	"github.com/google/uuid"
)

func TestMarcarReporteHistorico(t *testing.T) {
	ciudadano := newTestClient(t)
	ciudadano.login()
	creado := ciudadano.crearReporte()
	ruta := "/v1/reportes/" + creado.Id.String() + "/historico"

	// Un ciudadano no puede, aunque el reporte sea suyo.
	ciudadano.expect(http.StatusForbidden, http.MethodPut, ruta, nil)
	ciudadano.expect(http.StatusForbidden, http.MethodDelete, ruta, nil)

	enIncidentes := func(c *testClient) bool {
		rs := decode[[]httpapi.ReporteCercano](t, c.expect(http.StatusOK, http.MethodGet,
			"/v1/reportes/cercanos?lat=32.5149&lng=-117.0382&radio=100", nil))
		return slices.ContainsFunc(rs, func(r httpapi.ReporteCercano) bool { return r.Id == creado.Id })
	}
	if !enIncidentes(ciudadano) {
		t.Fatalf("el reporte nuevo no aparece en Incidentes")
	}

	// Cualquier rol distinto de ciudadano puede marcarlo.
	for _, rol := range []string{"admin", "moderador", "analista", "proteccion_civil", "rescatista"} {
		c := newTestClient(t)
		c.loginComo(rol)
		if r := decode[httpapi.Reporte](t, c.expect(http.StatusOK, http.MethodPut, ruta, nil)); !r.EsHistorico {
			t.Errorf("%s: es_historico = false tras marcar", rol)
		}
		if enIncidentes(c) {
			t.Errorf("%s: un reporte histórico sigue apareciendo en Incidentes", rol)
		}
		if r := decode[httpapi.Reporte](t, c.expect(http.StatusOK, http.MethodDelete, ruta, nil)); r.EsHistorico {
			t.Errorf("%s: es_historico = true tras desmarcar", rol)
		}
	}

	// Idempotente y con historial solo cuando cambia.
	admin := newTestClient(t)
	admin.loginComo("admin")
	antes := contarHistorial(t, "reporte.marcar_historico", "reporte", creado.Id.String())
	admin.expect(http.StatusOK, http.MethodPut, ruta, nil)
	admin.expect(http.StatusOK, http.MethodPut, ruta, nil)
	if n := contarHistorial(t, "reporte.marcar_historico", "reporte", creado.Id.String()); n != antes+1 {
		t.Errorf("eventos de marcar_historico = %d, quería %d (el segundo PUT no cambia nada)", n, antes+1)
	}

	admin.expect(http.StatusNotFound, http.MethodPut, "/v1/reportes/"+uuid.NewString()+"/historico", nil)
}
