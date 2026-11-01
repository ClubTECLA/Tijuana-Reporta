package server

import (
	"context"
	"time"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/almacen"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/comentario"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/config"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/db/sqlc"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/incidente"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/multimedia"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/reporte"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/usuario"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

// multimediaTimeout es lo que se espera a que multimedia reciba y guarde un archivo.
const multimediaTimeout = 30 * time.Second

// New arma los servicios de producción sobre pool y devuelve el router con
// el que se sirven. Es la única pieza que conoce a todas las funcionalidades.
func New(ctx context.Context, pool *pgxpool.Pool, cfg config.Config) (*gin.Engine, error) {
	usuarios := usuario.NewStore(pool)
	auth, err := usuario.NewAuth(ctx, usuarios, []byte(cfg.JWTSecret), cfg.JWTTTL)
	if err != nil {
		return nil, err
	}

	return NewRouter(Handlers{
		Reportes:    reporte.NewHandler(reporte.NewService(reporte.NewStore(pool))),
		Incidentes:  incidente.NewHandler(incidente.NewService(incidente.NewStore(pool))),
		Comentarios: comentario.NewHandler(comentario.NewService(comentario.NewStore(pool))),
		Usuarios:    usuario.NewHandler(auth, usuario.NewService(usuarios)),
		// multimedia no tiene operaciones de varias sentencias: le basta con
		// las consultas que genera sqlc.
		Multimedia: multimedia.NewHandler(multimedia.NewService(sqlc.New(pool), almacen.NewCliente(cfg.MultimediaURL, multimediaTimeout), multimedia.OpcionesFoto{
			MaxBytes:   cfg.MaxFotoBytes,
			MaxPixeles: cfg.MaxFotoPixeles,
		})),
	}, cfg.JWTSecret, WithMaxMultimediaBytes(cfg.MaxMultimediaBytes)), nil
}
