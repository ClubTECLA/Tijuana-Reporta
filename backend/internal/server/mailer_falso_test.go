package server_test

import (
	"context"
	"slices"
	"sync"
	"testing"
	"time"

	"github.com/google/uuid"
)

// mailerFalso hace de Mailer: guarda los PIN y avisos que se mandan para que
// el test lea el PIN y lo use en /auth/recovery/verify. Lleva mutex porque
// el servicio envía en segundo plano.
type mailerFalso struct {
	mu     sync.Mutex
	pines  map[string][]string // email -> PINs enviados, en orden
	avisos []string            // emails a los que se avisó del cambio
}

func (m *mailerFalso) EnviarPinRecuperacion(_ context.Context, _ uuid.UUID, email, pin string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	if m.pines == nil {
		m.pines = map[string][]string{}
	}
	m.pines[email] = append(m.pines[email], pin)
	return nil
}

func (m *mailerFalso) EnviarAvisoPasswordCambiado(_ context.Context, _ uuid.UUID, email string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.avisos = append(m.avisos, email)
	return nil
}

// envios cuenta los PIN enviados a email.
func (m *mailerFalso) envios(email string) int {
	m.mu.Lock()
	defer m.mu.Unlock()
	return len(m.pines[email])
}

// esperarPin espera a que llegue el PIN número n (desde 1) enviado a email y
// lo devuelve; falla el test si no llega a tiempo.
func (m *mailerFalso) esperarPin(t *testing.T, email string, n int) string {
	t.Helper()

	esperar(t, "PIN enviado a "+email, func() bool { return m.envios(email) >= n })
	m.mu.Lock()
	defer m.mu.Unlock()
	return m.pines[email][n-1]
}

// avisado dice si se mandó el aviso de cambio de contraseña a email.
func (m *mailerFalso) avisado(email string) bool {
	m.mu.Lock()
	defer m.mu.Unlock()
	return slices.Contains(m.avisos, email)
}

// esperar reintenta cond hasta que se cumpla o pasen 2 segundos, para los
// envíos que el servicio hace en segundo plano.
func esperar(t *testing.T, que string, cond func() bool) {
	t.Helper()

	for limite := time.Now().Add(2 * time.Second); time.Now().Before(limite); time.Sleep(10 * time.Millisecond) {
		if cond() {
			return
		}
	}
	t.Fatalf("esperando %s: no ocurrió a tiempo", que)
}
