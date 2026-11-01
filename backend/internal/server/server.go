package server

import (
	"context"
	"time"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/config"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/database"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/httpapi"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/multimedia"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

// multimediaTimeout es lo que se espera a que multimedia reciba y guarde un archivo.
const multimediaTimeout = 30 * time.Second

// New arma los servicios de producción sobre pool y devuelve el router con
// el que se sirven. Es la única pieza que conoce a todas las funcionalidades.
func New(ctx context.Context, pool *pgxpool.Pool, cfg config.Config) (*gin.Engine, error) {
	// Un solo Store para todos los servicios: expone las consultas generadas
	// por sqlc y las operaciones transaccionales sobre el mismo pool.
	store := database.NewStore(pool)

	auth, err := service.NewAuthService(ctx, store, []byte(cfg.JWTSecret), cfg.JWTTTL)
	if err != nil {
		return nil, err
	}

	return NewRouter(httpapi.Services{
		Comentarios: service.NewComentarioService(store),
		Reportes:    service.NewReporteService(store),
		Incidentes:  service.NewIncidenteService(store),
		Auth:        auth,
		Usuarios:    service.NewUsuarioService(store),
		Multimedia: service.NewMultimediaService(store, multimedia.NewCliente(cfg.MultimediaURL, multimediaTimeout), service.OpcionesFoto{
			MaxBytes:   cfg.MaxFotoBytes,
			MaxPixeles: cfg.MaxFotoPixeles,
		}),
	}, cfg.JWTSecret, WithMaxMultimediaBytes(cfg.MaxMultimediaBytes)), nil
}
