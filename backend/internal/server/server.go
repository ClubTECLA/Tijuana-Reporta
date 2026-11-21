package server

import (
	"context"
	"time"

	"github.com/ClubTECLA/cimalert/backend/internal/almacen"
	"github.com/ClubTECLA/cimalert/backend/internal/centro"
	"github.com/ClubTECLA/cimalert/backend/internal/comentario"
	"github.com/ClubTECLA/cimalert/backend/internal/config"
	"github.com/ClubTECLA/cimalert/backend/internal/db/sqlc"
	"github.com/ClubTECLA/cimalert/backend/internal/incidente"
	"github.com/ClubTECLA/cimalert/backend/internal/multimedia"
	"github.com/ClubTECLA/cimalert/backend/internal/reporte"
	"github.com/ClubTECLA/cimalert/backend/internal/usuario"
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

	mailer, err := usuario.NewMailer(cfg.MailDriver)
	if err != nil {
		return nil, err
	}
	rec := usuario.NewRecuperacion(usuarios, mailer, []byte(cfg.RecoverySecret))

	// Un solo cliente de multimedia: multimedia sube y borra archivos, y
	// reporte borra los de un reporte eliminado.
	archivos := almacen.NewCliente(cfg.MultimediaURL, multimediaTimeout)

	return NewRouter(Handlers{
		Reportes:    reporte.NewHandler(reporte.NewService(reporte.NewStore(pool), archivos)),
		Incidentes:  incidente.NewHandler(incidente.NewService(incidente.NewStore(pool))),
		Comentarios: comentario.NewHandler(comentario.NewService(comentario.NewStore(pool))),
		Usuarios:    usuario.NewHandler(auth, usuario.NewService(usuarios), rec),
		// multimedia no tiene operaciones de varias sentencias: le basta con
		// las consultas que genera sqlc.
		Multimedia: multimedia.NewHandler(multimedia.NewService(sqlc.New(pool), archivos, multimedia.OpcionesFoto{
			MaxBytes:   cfg.MaxFotoBytes,
			MaxPixeles: cfg.MaxFotoPixeles,
		}, multimedia.OpcionesVideo{
			MaxBytes:    cfg.MaxVideoBytes,
			MaxDuracion: time.Duration(cfg.MaxVideoSegundos) * time.Second,
		})),
		Centros: centro.NewHandler(centro.NewService(centro.NewStore(pool))),
	}, cfg.JWTSecret, usuarios.GetPasswordChangedAtByUserID, WithMaxMultimediaBytes(cfg.MaxMultimediaBytes)), nil
}
