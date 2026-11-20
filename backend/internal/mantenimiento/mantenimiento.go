// Package mantenimiento revisa cada madrugada los archivos nuevos del servicio
// multimedia contra la base de datos: aparta los que no cumplen las reglas o no
// tienen fila, borra las filas sin archivo y vacía la cuarentena vieja.
package mantenimiento

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"time"

	"github.com/ClubTECLA/cimalert/backend/internal/almacen"
	"github.com/ClubTECLA/cimalert/backend/internal/db/sqlc"
	"github.com/jackc/pgx/v5"
)

const (
	// nombreTarea identifica en mantenimiento_estado la tarea de multimedia.
	nombreTarea = "multimedia"

	// antiguedadMinima es lo que debe llevar creado un archivo para revisarlo: el
	// backend lo guarda y después inserta su fila, y no hay que tocar una subida en curso.
	antiguedadMinima = time.Hour

	// ventanaInicial es lo que se revisa la primera vez, cuando no hay un corte guardado.
	ventanaInicial = 24 * time.Hour

	// reintento es la espera para volver a intentar una pasada que falló.
	reintento = time.Hour

	// minFilasParaProporcion es desde cuántas filas en la ventana tiene sentido el
	// freno por proporción: con pocas, que falte una no dice nada.
	minFilasParaProporcion = 10
)

// ErrFreno indica que la pasada no actuó porque iba a tocar demasiado, lo que
// apunta a un problema de configuración o del volumen y no a archivos malos.
var ErrFreno = errors.New("la pasada se detuvo por el freno de seguridad")

// store es lo que el job necesita de la base; *sqlc.Queries lo cumple.
type store interface {
	GetCorteMantenimiento(ctx context.Context, nombre string) (time.Time, error)
	SetCorteMantenimiento(ctx context.Context, arg sqlc.SetCorteMantenimientoParams) error
	ListMultimediaPathsExistentes(ctx context.Context, paths []string) ([]string, error)
	ListMultimediaPathsCreadas(ctx context.Context, arg sqlc.ListMultimediaPathsCreadasParams) ([]string, error)
	DeleteMultimediaPorPaths(ctx context.Context, paths []string) (int64, error)
}

// Cliente es lo que el job necesita del servicio multimedia; *almacen.Cliente lo cumple.
type Cliente interface {
	Archivos(ctx context.Context, desde, hasta time.Time) ([]almacen.Archivo, error)
	Faltan(ctx context.Context, paths []string) ([]string, error)
	Cuarentena(ctx context.Context, path string) error
	PurgarCuarentena(ctx context.Context, antes time.Time) (int, error)
}

// Opciones reúne lo configurable del job.
type Opciones struct {
	Hora   int // hora del día en que corre (0 a 23), en la zona horaria del proceso
	Minuto int // minuto de esa hora (0 a 59)

	// MaxAcciones es el máximo de archivos y filas que una pasada puede tocar; si
	// va a tocar más, no hace nada.
	MaxAcciones int

	// CuarentenaDias es cuántos días se conserva un archivo en la cuarentena.
	CuarentenaDias int
}

// Job es la tarea diaria de mantenimiento de multimedia.
type Job struct {
	store   store
	cliente Cliente
	op      Opciones

	ahora   func() time.Time
	esperar func(ctx context.Context, d time.Duration) error
}

// New crea el job con la store, el cliente de multimedia y las opciones dadas.
func New(store store, cliente Cliente, op Opciones) *Job {
	return &Job{store: store, cliente: cliente, op: op, ahora: time.Now, esperar: esperar}
}

// Ejecutar corre el job todos los días a la hora configurada, hasta que ctx
// termine. Si una pasada falla la reintenta cada hora; si el freno la detiene
// avisa y espera al día siguiente.
func (j *Job) Ejecutar(ctx context.Context) {
	for {
		ahora := j.ahora()
		if err := j.esperar(ctx, proximaEjecucion(ahora, j.op.Hora, j.op.Minuto).Sub(ahora)); err != nil {
			return
		}
		j.correrConReintentos(ctx)
	}
}

// correrConReintentos hace una pasada y, si falla, la repite cada hora hasta que
// salga bien, la detenga el freno o termine ctx.
func (j *Job) correrConReintentos(ctx context.Context) {
	for {
		err := j.Pasar(ctx)
		switch {
		case err == nil:
			return
		case errors.Is(err, ErrFreno):
			slog.ErrorContext(ctx, "multimedia maintenance stopped by the safety brake; check it by hand", "error", err)
			return
		}

		slog.ErrorContext(ctx, "multimedia maintenance failed; retrying later", "error", err, "retry_in", reintento)
		if j.esperar(ctx, reintento) != nil {
			return
		}
	}
}

// Pasar hace una pasada completa: revisa lo nuevo desde el último corte y vacía
// la cuarentena vieja. Solo avanza el corte si todo salió bien, así una pasada
// fallida se repite sobre la misma ventana (la primera vez, el corte es el inicio
// de la ventana inicial).
func (j *Job) Pasar(ctx context.Context) error {
	ahora := j.ahora()
	if err := j.revisar(ctx, ahora); err != nil {
		return err
	}
	return j.vaciarCuarentena(ctx, ahora)
}

// plan es lo que una pasada va a hacer.
type plan struct {
	// invalidos son archivos que no cumplen las reglas; van a cuarentena y se borra su fila.
	invalidos []string
	// filasInvalidas es cuántos de los invalidos tienen fila, que también se borra.
	filasInvalidas int
	// sinFila son archivos válidos que no tienen fila; van a cuarentena.
	sinFila []string
	// filasSinArchivo son filas cuyo archivo ya no existe; se borran.
	filasSinArchivo []string

	archivos, filas int
}

// acciones es cuántos archivos y filas va a tocar el plan: un archivo inválido
// con fila cuenta dos, porque se aparta el archivo y se borra la fila.
func (p plan) acciones() int {
	return len(p.invalidos) + p.filasInvalidas + len(p.sinFila) + len(p.filasSinArchivo)
}

// revisar aplica las reglas a lo creado entre el último corte y una hora antes de ahora.
func (j *Job) revisar(ctx context.Context, ahora time.Time) error {
	hasta := ahora.Add(-antiguedadMinima)
	desde, err := j.store.GetCorteMantenimiento(ctx, nombreTarea)
	switch {
	case errors.Is(err, pgx.ErrNoRows):
		// Se guarda el inicio de la ventana: si la pasada falla, el reintento (con
		// otra hora) debe revisar desde el mismo punto y no dejar fuera lo más viejo.
		desde = hasta.Add(-ventanaInicial)
		if err := j.store.SetCorteMantenimiento(ctx, sqlc.SetCorteMantenimientoParams{Nombre: nombreTarea, UltimoCorte: desde}); err != nil {
			return fmt.Errorf("guardar el inicio de la ventana: %w", err)
		}
	case err != nil:
		return fmt.Errorf("leer el último corte: %w", err)
	}
	if !desde.Before(hasta) {
		return nil
	}

	p, err := j.planear(ctx, desde, hasta)
	if err != nil {
		return err
	}
	if err := j.frenar(p); err != nil {
		slog.ErrorContext(ctx, "multimedia maintenance is about to touch too much",
			"files", p.archivos, "rows", p.filas, "invalid", len(p.invalidos),
			"without_row", len(p.sinFila), "rows_without_file", len(p.filasSinArchivo),
			"max_actions", j.op.MaxAcciones)
		return err
	}

	if err := j.aplicar(ctx, p); err != nil {
		return err
	}
	if err := j.store.SetCorteMantenimiento(ctx, sqlc.SetCorteMantenimientoParams{Nombre: nombreTarea, UltimoCorte: hasta}); err != nil {
		return fmt.Errorf("guardar el corte: %w", err)
	}

	slog.InfoContext(ctx, "multimedia maintenance done",
		"from", desde, "to", hasta, "files", p.archivos, "rows", p.filas,
		"invalid", len(p.invalidos), "without_row", len(p.sinFila), "rows_without_file", len(p.filasSinArchivo))
	return nil
}

// planear decide qué hacer con lo creado entre desde (incluido) y hasta (no
// incluido). Solo lee: no cambia nada.
func (j *Job) planear(ctx context.Context, desde, hasta time.Time) (plan, error) {
	archivos, err := j.cliente.Archivos(ctx, desde, hasta)
	if err != nil {
		return plan{}, fmt.Errorf("listar archivos: %w", err)
	}
	filas, err := j.store.ListMultimediaPathsCreadas(ctx, sqlc.ListMultimediaPathsCreadasParams{Desde: desde, Hasta: hasta})
	if err != nil {
		return plan{}, fmt.Errorf("listar filas: %w", err)
	}

	rutas := make([]string, len(archivos))
	for i, a := range archivos {
		rutas[i] = a.Path
	}
	conFila, err := j.filasDe(ctx, rutas)
	if err != nil {
		return plan{}, err
	}
	faltan, err := j.cliente.Faltan(ctx, filas)
	if err != nil {
		return plan{}, fmt.Errorf("consultar filas sin archivo: %w", err)
	}

	p := plan{archivos: len(archivos), filas: len(filas), filasSinArchivo: faltan}
	for _, a := range archivos {
		switch {
		case a.Motivo != "":
			p.invalidos = append(p.invalidos, a.Path)
			if conFila[a.Path] {
				p.filasInvalidas++
			}
		case !conFila[a.Path]:
			p.sinFila = append(p.sinFila, a.Path)
		}
	}
	return p, nil
}

// filasDe devuelve cuáles de las rutas tienen fila en la base.
func (j *Job) filasDe(ctx context.Context, rutas []string) (map[string]bool, error) {
	conFila := make(map[string]bool, len(rutas))
	if len(rutas) == 0 {
		return conFila, nil
	}
	existentes, err := j.store.ListMultimediaPathsExistentes(ctx, rutas)
	if err != nil {
		return nil, fmt.Errorf("buscar filas de los archivos: %w", err)
	}
	for _, r := range existentes {
		conFila[r] = true
	}
	return conFila, nil
}

// frenar devuelve ErrFreno si el plan toca demasiado: o más acciones que
// MaxAcciones, o la mitad o más de las filas sin archivo, que apunta a un volumen
// vacío o desmontado y no a archivos perdidos de uno en uno.
func (j *Job) frenar(p plan) error {
	if p.acciones() > j.op.MaxAcciones {
		return fmt.Errorf("%w: %d acciones, el máximo es %d", ErrFreno, p.acciones(), j.op.MaxAcciones)
	}
	if p.filas >= minFilasParaProporcion && len(p.filasSinArchivo)*2 >= p.filas {
		return fmt.Errorf("%w: %d de %d filas no tienen archivo", ErrFreno, len(p.filasSinArchivo), p.filas)
	}
	return nil
}

// aplicar ejecuta el plan. Sigue con lo demás si algo falla y devuelve todos los
// errores juntos. La fila de un archivo inválido solo se borra si el archivo ya
// quedó en cuarentena.
func (j *Job) aplicar(ctx context.Context, p plan) error {
	var errs []error
	filasABorrar := append([]string(nil), p.filasSinArchivo...)

	for _, ruta := range p.invalidos {
		if err := j.cliente.Cuarentena(ctx, ruta); err != nil {
			errs = append(errs, fmt.Errorf("mandar %s a cuarentena: %w", ruta, err))
			continue
		}
		slog.WarnContext(ctx, "invalid file moved to quarantine", "path", ruta)
		filasABorrar = append(filasABorrar, ruta)
	}
	for _, ruta := range p.sinFila {
		if err := j.cliente.Cuarentena(ctx, ruta); err != nil {
			errs = append(errs, fmt.Errorf("mandar %s a cuarentena: %w", ruta, err))
			continue
		}
		slog.WarnContext(ctx, "file without row moved to quarantine", "path", ruta)
	}

	if len(filasABorrar) > 0 {
		if _, err := j.store.DeleteMultimediaPorPaths(ctx, filasABorrar); err != nil {
			errs = append(errs, fmt.Errorf("borrar filas: %w", err))
		} else {
			for _, ruta := range p.filasSinArchivo {
				slog.WarnContext(ctx, "row without file deleted", "path", ruta)
			}
		}
	}
	return errors.Join(errs...)
}

// vaciarCuarentena borra de la cuarentena lo que lleva en ella más de CuarentenaDias días.
func (j *Job) vaciarCuarentena(ctx context.Context, ahora time.Time) error {
	antes := ahora.AddDate(0, 0, -j.op.CuarentenaDias)
	borrados, err := j.cliente.PurgarCuarentena(ctx, antes)
	if err != nil {
		return fmt.Errorf("vaciar la cuarentena: %w", err)
	}
	if borrados > 0 {
		slog.InfoContext(ctx, "quarantine purged", "deleted", borrados, "older_than", antes)
	}
	return nil
}

// proximaEjecucion devuelve la próxima vez que son las hora:minuto, en la zona de ahora.
func proximaEjecucion(ahora time.Time, hora, minuto int) time.Time {
	t := time.Date(ahora.Year(), ahora.Month(), ahora.Day(), hora, minuto, 0, 0, ahora.Location())
	if !t.After(ahora) {
		t = t.AddDate(0, 0, 1)
	}
	return t
}

// esperar duerme d o hasta que ctx termine, y en ese caso devuelve su error.
func esperar(ctx context.Context, d time.Duration) error {
	t := time.NewTimer(d)
	defer t.Stop()

	select {
	case <-ctx.Done():
		return ctx.Err()
	case <-t.C:
		return nil
	}
}
