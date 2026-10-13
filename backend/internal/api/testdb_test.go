package api_test

import (
	"context"
	"errors"
	"fmt"
	"log"
	"os"
	"strings"
	"sync"
	"testing"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/database"
	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/pgx/v5"
	"github.com/golang-migrate/migrate/v4/source/iofs"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/modules/postgres"
)

// La base de los tests es un contenedor postgres:16 desechable (la misma
// imagen que docker-compose.yml) con las migraciones aplicadas. Se levanta
// una sola vez por corrida, la primera vez que un test la pide, y se borra
// al terminar. Solo hace falta tener Docker corriendo; sin Docker los tests
// de integración se saltan.
var (
	dbOnce      sync.Once
	dbPool      *pgxpool.Pool
	dbErr       error
	dbContainer *postgres.PostgresContainer
)

func TestMain(m *testing.M) {
	code := m.Run()

	if dbPool != nil {
		dbPool.Close()
	}
	if dbContainer != nil {
		if err := testcontainers.TerminateContainer(dbContainer); err != nil {
			log.Printf("borrando el contenedor de postgres: %v", err)
		}
	}
	os.Exit(code)
}

// testPool devuelve el pool de la base de los tests, levantándola si es la
// primera vez que se pide.
func testPool(t *testing.T) *pgxpool.Pool {
	t.Helper()

	testcontainers.SkipIfProviderIsNotHealthy(t)

	dbOnce.Do(func() {
		dbPool, dbErr = startTestDB(context.Background())
	})
	if dbErr != nil {
		t.Fatalf("levantando la base de los tests: %v", dbErr)
	}
	return dbPool
}

func startTestDB(ctx context.Context) (*pgxpool.Pool, error) {
	var err error
	dbContainer, err = postgres.Run(ctx, "postgres:16",
		postgres.WithDatabase("tijuana_test"),
		postgres.WithUsername("test"),
		postgres.WithPassword("test"),
		postgres.BasicWaitStrategies(),
	)
	if err != nil {
		return nil, fmt.Errorf("arrancando el contenedor: %w", err)
	}

	dbURL, err := dbContainer.ConnectionString(ctx, "sslmode=disable")
	if err != nil {
		return nil, err
	}

	if err := migrateUp(dbURL); err != nil {
		return nil, fmt.Errorf("aplicando migraciones: %w", err)
	}

	return database.Connect(dbURL)
}

// migrateUp aplica las migraciones embebidas con golang-migrate, la misma
// herramienta que usa el servicio migrate de docker-compose.yml.
func migrateUp(dbURL string) error {
	src, err := iofs.New(database.Migrations, "migrations")
	if err != nil {
		return err
	}

	// El driver pgx/v5 de golang-migrate se registra con el esquema pgx5://.
	m, err := migrate.NewWithSourceInstance("iofs", src, strings.Replace(dbURL, "postgres://", "pgx5://", 1))
	if err != nil {
		return err
	}
	defer m.Close()

	if err := m.Up(); err != nil && !errors.Is(err, migrate.ErrNoChange) {
		return err
	}
	return nil
}
