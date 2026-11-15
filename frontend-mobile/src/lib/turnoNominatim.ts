// Política de uso de Nominatim: ~1 petición por segundo en total. La búsqueda de direcciones y la dirección de
// cada refugio comparten este reloj, para que juntas no lo superen.
const NOMINATIM_INTERVALO_MS = 1000;
let proximoTurno = 0;

/** Espera el turno para llamar a Nominatim: reserva un hueco cada `NOMINATIM_INTERVALO_MS`, sea cual sea el llamador. */
export function esperarTurnoNominatim(ahora: () => number = Date.now): Promise<void> {
  const inicio = ahora();
  const turno = Math.max(inicio, proximoTurno);
  proximoTurno = turno + NOMINATIM_INTERVALO_MS;
  const espera = turno - inicio;
  return espera > 0 ? new Promise((resolver) => setTimeout(resolver, espera)) : Promise.resolve();
}

/** Solo para tests: libera los turnos reservados. */
export const reiniciarTurnosNominatim = () => {
  proximoTurno = 0;
};
