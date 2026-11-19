/**
 * Cola que corre las tareas de una en una, en el orden en que llegan: cada una empieza cuando termina la anterior,
 * haya salido bien o mal. Así, si dos cambios reemplazan el mismo dato con la respuesta del servidor, la última
 * respuesta aplicada es siempre la del último cambio.
 */
export function crearColaSerial() {
    let ultima: Promise<unknown> = Promise.resolve();

    return function enCola<T>(tarea: () => Promise<T>): Promise<T> {
        const resultado = ultima.then(tarea, tarea);
        // Un fallo se entrega a quien lo pidió, pero no detiene las tareas siguientes.
        ultima = resultado.catch(() => undefined);
        return resultado;
    };
}
