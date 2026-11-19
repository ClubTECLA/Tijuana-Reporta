package server_test

import (
	"fmt"
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

func TestRiesgo(t *testing.T) {
	admin := newTestClient(t)
	admin.loginComo("admin")

	// Un tipo de incidente propio del test: filtrando por él, el resultado
	// no depende de lo que hayan creado otros tests.
	inc := admin.crearIncidente(map[string]any{"nombre": nombreIncidente(), "color": "#3366FF", "esta_activo": true})

	// 5 reportes a menos de 100 m entre sí (una zona) y 1 lejos (ruido).
	puntos := [][2]float64{
		{32.4500, -116.9000}, {32.4503, -116.9002}, {32.4498, -116.8997},
		{32.4502, -116.9004}, {32.4499, -116.9003}, {32.6000, -117.1000},
	}
	for i, p := range puntos {
		r := decode[httpapi.Reporte](t, admin.expect(http.StatusCreated, http.MethodPost, "/v1/reportes", map[string]any{
			"incidente_id": inc.Id, "latitude": p[0], "longitude": p[1],
			"direccion": fmt.Sprintf("Calle %d · Colonia Prueba Riesgo", i),
		}))
		// Los activos no cuentan: solo se marca histórico al final.
		if i == 0 {
			res := decode[httpapi.ResumenRiesgo](t, admin.expect(http.StatusOK, http.MethodGet,
				fmt.Sprintf("/v1/riesgo/resumen?incidente_id=%d", inc.Id), nil))
			if res.TotalHistoricos != 0 {
				t.Fatalf("total_historicos = %d con un reporte activo, quería 0", res.TotalHistoricos)
			}
		}
		admin.expect(http.StatusOK, http.MethodPut, "/v1/reportes/"+r.Id.String()+"/historico", nil)
	}

	t.Run("resumen", func(t *testing.T) {
		tc := *admin
		tc.t = t
		res := decode[httpapi.ResumenRiesgo](t, tc.expect(http.StatusOK, http.MethodGet,
			fmt.Sprintf("/v1/riesgo/resumen?incidente_id=%d", inc.Id), nil))

		if res.TotalHistoricos != 6 {
			t.Errorf("total_historicos = %d, quería 6", res.TotalHistoricos)
		}
		if len(res.Categorias) != 1 || res.Categorias[0].IncidenteId != inc.Id || res.Categorias[0].Total != 6 {
			t.Errorf("categorias = %+v, quería [{%d 6}]", res.Categorias, inc.Id)
		}
		if len(res.Zonas) != 1 {
			t.Fatalf("zonas = %+v, quería 1 (el punto lejano es ruido)", res.Zonas)
		}
		z := res.Zonas[0]
		if z.Reportes != 5 || z.Nombre != "Colonia Prueba Riesgo" || z.Nivel != httpapi.Alto || z.Score != 1 {
			t.Errorf("zona = %+v, quería 5 reportes, Colonia Prueba Riesgo, Alto, score 1", z)
		}
		if res.ZonasAltoRiesgo != 1 {
			t.Errorf("zonas_alto_riesgo = %d, quería 1", res.ZonasAltoRiesgo)
		}
		if len(res.Colonias) != 1 || res.Colonias[0].Nombre != "Colonia Prueba Riesgo" || res.Colonias[0].Reportes != 6 {
			t.Errorf("colonias = %+v, quería [Colonia Prueba Riesgo, 6]", res.Colonias)
		}
		if res.VersionModelo != 1 {
			t.Errorf("version_modelo = %d, quería 1", res.VersionModelo)
		}
	})

	t.Run("mapa de calor", func(t *testing.T) {
		tc := *admin
		tc.t = t
		mapa := decode[httpapi.MapaCalor](t, tc.expect(http.StatusOK, http.MethodGet,
			fmt.Sprintf("/v1/riesgo/mapa-calor?min_lat=32.44&max_lat=32.46&min_lng=-116.91&max_lng=-116.89&zoom=13&incidente_id=%d", inc.Id), nil))

		total := 0
		for _, c := range mapa.Celdas {
			total += c.Reportes
		}
		if total != 5 {
			t.Errorf("reportes en las celdas = %d, quería 5 (el lejano queda fuera del área)", total)
		}
		if mapa.TamanoCeldaM < 500 || mapa.TamanoCeldaM > 530 || mapa.PesoMaximo <= 0 {
			t.Errorf("tamano_celda_m = %v, peso_maximo = %v, quería ≈ 516 y > 0", mapa.TamanoCeldaM, mapa.PesoMaximo)
		}
	})

	// Con el mapa muy alejado la caja abarca 180° o más de longitud: sin partirla, PostGIS devolvía 0 celdas (o
	// fallaba con exactamente 180°).
	t.Run("mapa de calor con el mundo entero", func(t *testing.T) {
		tc := *admin
		tc.t = t
		for _, lng := range []string{"min_lng=-180&max_lng=180", "min_lng=-180&max_lng=0"} {
			mapa := decode[httpapi.MapaCalor](t, tc.expect(http.StatusOK, http.MethodGet,
				fmt.Sprintf("/v1/riesgo/mapa-calor?min_lat=-85&max_lat=85&%s&zoom=0&incidente_id=%d", lng, inc.Id), nil))
			total := 0
			for _, c := range mapa.Celdas {
				total += c.Reportes
			}
			if total != 6 {
				t.Errorf("%s: reportes en las celdas = %d, quería 6", lng, total)
			}
		}
	})

	// [-177, -57] se pide en dos tramos de 60° que comparten -117: un reporte
	// justo en ese borde debe contar una sola vez.
	t.Run("reporte en el borde entre tramos", func(t *testing.T) {
		tc := *admin
		tc.t = t
		borde := tc.crearIncidente(map[string]any{"nombre": nombreIncidente(), "color": "#33AA66", "esta_activo": true})
		r := decode[httpapi.Reporte](t, tc.expect(http.StatusCreated, http.MethodPost, "/v1/reportes", map[string]any{
			"incidente_id": borde.Id, "latitude": 32.5, "longitude": -117.0,
		}))
		tc.expect(http.StatusOK, http.MethodPut, "/v1/reportes/"+r.Id.String()+"/historico", nil)

		for _, lng := range []string{"min_lng=-177&max_lng=-57", "min_lng=-120&max_lng=-117"} {
			mapa := decode[httpapi.MapaCalor](t, tc.expect(http.StatusOK, http.MethodGet,
				fmt.Sprintf("/v1/riesgo/mapa-calor?min_lat=30&max_lat=35&%s&zoom=3&incidente_id=%d", lng, borde.Id), nil))
			total := 0
			for _, c := range mapa.Celdas {
				total += c.Reportes
			}
			if total != 1 {
				t.Errorf("%s: reportes en las celdas = %d, quería 1", lng, total)
			}
		}
	})

	t.Run("validaciones", func(t *testing.T) {
		tc := *admin
		tc.t = t
		tc.expect(http.StatusBadRequest, http.MethodGet, "/v1/riesgo/mapa-calor?min_lat=32.6&max_lat=32.4&min_lng=-117&max_lng=-116&zoom=12", nil)
		tc.expect(http.StatusBadRequest, http.MethodGet, "/v1/riesgo/resumen?desde=2026-02-01T00:00:00Z&hasta=2026-01-01T00:00:00Z", nil)
		tc.expect(http.StatusBadRequest, http.MethodGet, "/v1/riesgo/mapa-calor?min_lat=32.4&max_lat=32.6&min_lng=-117&max_lng=-116", nil) // falta zoom
	})

	t.Run("roles", func(t *testing.T) {
		ciudadano := newTestClient(t)
		ciudadano.login()
		ciudadano.expect(http.StatusForbidden, http.MethodGet, "/v1/riesgo/resumen", nil)
		for _, rol := range []string{"moderador", "analista", "proteccion_civil", "rescatista"} {
			c := newTestClient(t)
			c.loginComo(rol)
			c.expect(http.StatusOK, http.MethodGet, "/v1/riesgo/resumen", nil)
		}
		anonimo := newTestClient(t)
		anonimo.expect(http.StatusUnauthorized, http.MethodGet, "/v1/riesgo/resumen", nil)
	})
}
