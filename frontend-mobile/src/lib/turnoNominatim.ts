// Política de uso de Nominatim: ~1 petición por segundo en total. La búsqueda de direcciones y la dirección de
// cada refugio comparten este reloj, para que juntas no lo superen.
const NOMINATIM_INTERVALO_MS = 1000;

const dormir = (ms: number) => new Promise<void>((resolver) => setTimeout(resolver, ms));

// Los turnos se sueltan de uno en uno (cola) y el plazo del siguiente parte de la salida REAL del anterior.
let cola: Promise<void> = Promise.resolve();
let ultimaSalida = -Infinity;

/**
 * Espera el turno para llamar a Nominatim. Al despertar de cada espera vuelve a comprobar el plazo (un temporizador
 * puede despertar antes de lo pedido) y solo entonces anota la hora de salida, de la que parte el turno siguiente.
 */
export function esperarTurnoNominatim(ahora: () => number = Date.now): Promise<void> {
  const turno = cola.then(async () => {
    let espera = ultimaSalida + NOMINATIM_INTERVALO_MS - ahora();
    while (espera > 0) {
      await dormir(espera);
      espera = ultimaSalida + NOMINATIM_INTERVALO_MS - ahora();
    }
    ultimaSalida = ahora();
  });
  cola = turno;
  return turno;
}

/** Solo para tests: libera los turnos reservados. */
export const reiniciarTurnosNominatim = () => {
  cola = Promise.resolve();
  ultimaSalida = -Infinity;
};
