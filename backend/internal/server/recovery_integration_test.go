package server_test

// Tests de integración de la recuperación de contraseña. Cada test usa un email único para
// que el límite por email, que vive en Postgres, no se cruce entre tests; cada
// newTestClient trae su propio límite por IP.

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/ClubTECLA/cimalert/backend/internal/httpapi"
)

const (
	rutaRecovery  = "/v1/auth/recovery"
	rutaVerify    = "/v1/auth/recovery/verify"
	passwordNuevo = "otro-password-456"
)

// registrar crea un usuario con password local y devuelve sus credenciales,
// sin dejar el token en el cliente.
func (c *testClient) registrar() (email, password string) {
	c.t.Helper()

	email, password = credenciales()
	c.expect(http.StatusCreated, http.MethodPost, "/v1/auth/register", map[string]any{
		"email": email, "username": "tester", "password": password,
	})
	return email, password
}

// pedirPin solicita la recuperación para email y devuelve el PIN número n
// que recibe el mailer falso.
func (c *testClient) pedirPin(email string, n int) string {
	c.t.Helper()

	c.expect(http.StatusAccepted, http.MethodPost, rutaRecovery, map[string]any{"email": email})
	return c.mailer.esperarPin(c.t, email, n)
}

// verificar manda el PIN con passwordNuevo y devuelve la respuesta.
func (c *testClient) verificar(email, pin string) *httptest.ResponseRecorder {
	c.t.Helper()

	return c.do(http.MethodPost, rutaVerify, map[string]any{
		"email": email, "pin": pin, "new_password": passwordNuevo,
	})
}

// puedeEntrar dice si el login con email y password responde 200.
func (c *testClient) puedeEntrar(email, password string) bool {
	c.t.Helper()

	return c.do(http.MethodPost, "/v1/auth/login", map[string]any{"email": email, "password": password}).Code == http.StatusOK
}

// pinIncorrecto devuelve un PIN de 6 dígitos distinto de pin.
func pinIncorrecto(pin string) string {
	if pin == "000000" {
		return "111111"
	}
	return "000000"
}

func TestRecovery_CambiaElPassword(t *testing.T) {
	c := newTestClient(t)
	email, viejo := c.registrar()

	pin := c.pedirPin(email, 1)
	if rec := c.verificar(email, pin); rec.Code != http.StatusNoContent {
		t.Fatalf("verify: status = %d, quería 204; body: %s", rec.Code, rec.Body)
	}

	if c.puedeEntrar(email, viejo) {
		t.Error("el password viejo sigue sirviendo")
	}
	if !c.puedeEntrar(email, passwordNuevo) {
		t.Error("el password nuevo no sirve")
	}
	esperar(t, "aviso de password cambiado", func() bool { return c.mailer.avisado(email) })
}

func TestRecovery_InvalidaLosTokensAnteriores(t *testing.T) {
	c := newTestClient(t)
	email, password := c.registrar()
	viejo := decode[httpapi.AuthResponse](t, c.expect(http.StatusOK, http.MethodPost, "/v1/auth/login", map[string]any{
		"email": email, "password": password,
	})).AccessToken

	// El iat tiene precisión de segundos y un token del mismo segundo que el
	// cambio sigue valiendo (ver la spec); se espera para que quede antes.
	time.Sleep(time.Second)
	c.expect(http.StatusNoContent, http.MethodPost, rutaVerify, map[string]any{
		"email": email, "pin": c.pedirPin(email, 1), "new_password": passwordNuevo,
	})

	c.token = viejo
	c.expect(http.StatusUnauthorized, http.MethodGet, "/v1/auth/me", nil)

	c.token = decode[httpapi.AuthResponse](t, c.expect(http.StatusOK, http.MethodPost, "/v1/auth/login", map[string]any{
		"email": email, "password": passwordNuevo,
	})).AccessToken
	c.expect(http.StatusOK, http.MethodGet, "/v1/auth/me", nil)
}

func TestRecovery_NoRevelaSiLaCuentaExiste(t *testing.T) {
	c := newTestClient(t)
	existente, _ := c.registrar()
	inexistente, _ := credenciales()

	// Cuenta sin password local (como las de Google): email, pero sin password_hash.
	sinPassword, _ := credenciales()
	if _, err := testPool(t).Exec(t.Context(),
		`INSERT INTO users (email, username, rol_id) VALUES ($1, 'google', (SELECT id FROM roles WHERE nombre = 'ciudadano'))`,
		sinPassword); err != nil {
		t.Fatalf("creando usuario sin password: %v", err)
	}

	respuestas := map[string]*httptest.ResponseRecorder{}
	for _, email := range []string{inexistente, sinPassword, existente} {
		respuestas[email] = c.do(http.MethodPost, rutaRecovery, map[string]any{"email": email})
	}

	base := respuestas[existente]
	if base.Code != http.StatusAccepted {
		t.Fatalf("cuenta existente: status = %d, quería 202", base.Code)
	}
	for email, rec := range respuestas {
		if rec.Code != base.Code || rec.Body.String() != base.Body.String() {
			t.Errorf("%s: respuesta %d %q, distinta de la cuenta existente %d %q", email, rec.Code, rec.Body, base.Code, base.Body)
		}
	}

	c.mailer.esperarPin(t, existente, 1)
	for _, email := range []string{inexistente, sinPassword} {
		if n := c.mailer.envios(email); n != 0 {
			t.Errorf("%s: se enviaron %d PIN, quería 0", email, n)
		}
	}
}

func TestRecovery_TodoFalloDeVerifyEsIgual(t *testing.T) {
	// Cada caso deja la cuenta en un estado y devuelve el email y el PIN a mandar.
	casos := map[string]func(c *testClient) (email, pin string){
		"email desconocido": func(c *testClient) (string, string) {
			email, _ := credenciales()
			return email, "123456"
		},
		"PIN incorrecto": func(c *testClient) (string, string) {
			email, _ := c.registrar()
			return email, pinIncorrecto(c.pedirPin(email, 1))
		},
		"PIN expirado": func(c *testClient) (string, string) {
			email, _ := c.registrar()
			pin := c.pedirPin(email, 1)
			if _, err := testPool(c.t).Exec(c.t.Context(),
				`UPDATE recovery_pins SET expires_at = now() - interval '1 minute'
				 WHERE user_id = (SELECT id FROM users WHERE email = $1)`, email); err != nil {
				c.t.Fatalf("expirando PIN: %v", err)
			}
			return email, pin
		},
		"PIN ya usado": func(c *testClient) (string, string) {
			email, _ := c.registrar()
			pin := c.pedirPin(email, 1)
			c.expect(http.StatusNoContent, http.MethodPost, rutaVerify, map[string]any{
				"email": email, "pin": pin, "new_password": passwordNuevo,
			})
			return email, pin
		},
		"PIN bloqueado": func(c *testClient) (string, string) {
			email, _ := c.registrar()
			pin := c.pedirPin(email, 1)
			for range 5 {
				c.verificar(email, pinIncorrecto(pin))
			}
			return email, pin
		},
	}

	var base *httptest.ResponseRecorder
	for nombre, preparar := range casos {
		c := newTestClient(t) // un límite por IP nuevo por caso
		email, pin := preparar(c)
		rec := c.verificar(email, pin)

		if rec.Code != http.StatusBadRequest {
			t.Errorf("%s: status = %d, quería 400; body: %s", nombre, rec.Code, rec.Body)
			continue
		}
		if base == nil {
			base = rec
		} else if rec.Body.String() != base.Body.String() {
			t.Errorf("%s: body %q, distinto de %q", nombre, rec.Body, base.Body)
		}
	}
}

func TestRecovery_SeBloqueaTras5Intentos(t *testing.T) {
	c := newTestClient(t)
	email, password := c.registrar()
	pin := c.pedirPin(email, 1)

	for i := range 5 {
		if rec := c.verificar(email, pinIncorrecto(pin)); rec.Code != http.StatusBadRequest {
			t.Fatalf("intento %d: status = %d, quería 400", i+1, rec.Code)
		}
	}
	if rec := c.verificar(email, pin); rec.Code != http.StatusBadRequest {
		t.Errorf("PIN correcto tras 5 fallos: status = %d, quería 400", rec.Code)
	}
	if !c.puedeEntrar(email, password) {
		t.Error("el password cambió aunque el PIN estaba bloqueado")
	}
}

func TestRecovery_PinDeUnSoloUso(t *testing.T) {
	c := newTestClient(t)
	email, _ := c.registrar()
	pin := c.pedirPin(email, 1)

	c.expect(http.StatusNoContent, http.MethodPost, rutaVerify, map[string]any{
		"email": email, "pin": pin, "new_password": passwordNuevo,
	})
	if rec := c.verificar(email, pin); rec.Code != http.StatusBadRequest {
		t.Errorf("segundo uso: status = %d, quería 400", rec.Code)
	}
}

func TestRecovery_NuevaSolicitudCancelaLaAnterior(t *testing.T) {
	c := newTestClient(t)
	email, _ := c.registrar()
	primero := c.pedirPin(email, 1)
	segundo := c.pedirPin(email, 2)

	if primero != segundo {
		if rec := c.verificar(email, primero); rec.Code != http.StatusBadRequest {
			t.Errorf("primer PIN: status = %d, quería 400", rec.Code)
		}
	}
	if rec := c.verificar(email, segundo); rec.Code != http.StatusNoContent {
		t.Errorf("segundo PIN: status = %d, quería 204; body: %s", rec.Code, rec.Body)
	}
}

func TestRecovery_LimitePorEmail(t *testing.T) {
	c := newTestClient(t)
	email, _ := c.registrar()
	for i := 1; i <= 3; i++ {
		c.pedirPin(email, i)
	}

	// Responde igual que siempre para no revelar que la cuenta existe; solo no envía.
	c.expect(http.StatusAccepted, http.MethodPost, rutaRecovery, map[string]any{"email": email})
	// Da tiempo a un envío en segundo plano que no debería ocurrir.
	time.Sleep(100 * time.Millisecond)
	if n := c.mailer.envios(email); n != 3 {
		t.Errorf("se enviaron %d PIN, quería 3", n)
	}
}

func TestRecovery_LimitePorIP(t *testing.T) {
	c := newTestClient(t)
	email, _ := credenciales()

	for range 30 {
		if rec := c.verificar(email, "123456"); rec.Code == http.StatusTooManyRequests {
			return
		}
	}
	t.Error("30 verify seguidos desde la misma IP nunca respondieron 429")
}

func TestRecovery_ReglasDelPassword(t *testing.T) {
	c := newTestClient(t)
	email, password := c.registrar()
	pin := c.pedirPin(email, 1)

	for _, invalido := range []string{"corto", strings.Repeat("a", 73)} { // mínimo del contrato, máximo de bcrypt
		c.expect(http.StatusBadRequest, http.MethodPost, rutaVerify, map[string]any{
			"email": email, "pin": pin, "new_password": invalido,
		})
	}
	if !c.puedeEntrar(email, password) {
		t.Error("el password cambió con un new_password inválido")
	}
}
