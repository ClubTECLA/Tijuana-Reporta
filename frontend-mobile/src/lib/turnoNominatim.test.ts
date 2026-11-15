import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { esperarTurnoNominatim, reiniciarTurnosNominatim } from '@/lib/turnoNominatim';

describe('esperarTurnoNominatim', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    reiniciarTurnosNominatim();
  });
  afterEach(() => vi.useRealTimers());

  it('la primera llamada sale al instante y las siguientes se separan 1 s', async () => {
    const salidas: number[] = [];
    const lanzar = () => esperarTurnoNominatim(() => Date.now()).then(() => salidas.push(Date.now()));
    const inicio = Date.now();
    const todas = Promise.all([lanzar(), lanzar(), lanzar()]);
    await vi.advanceTimersByTimeAsync(2000);
    await todas;
    expect(salidas.map((t) => t - inicio)).toEqual([0, 1000, 2000]);
  });

  it('tras una pausa larga vuelve a salir sin espera', async () => {
    await esperarTurnoNominatim(() => Date.now());
    await vi.advanceTimersByTimeAsync(5000);
    const antes = Date.now();
    await esperarTurnoNominatim(() => Date.now());
    expect(Date.now() - antes).toBe(0);
  });

  it('si el temporizador despierta antes de tiempo, vuelve a esperar el resto del plazo', async () => {
    await esperarTurnoNominatim(() => Date.now());
    const inicio = Date.now();
    // Reloj del limitador: empieza al día y, una vez dormido, se queda 300 ms atrás (despertar "temprano").
    let atraso = 0;
    const ahora = () => Date.now() - atraso;
    const salidas: number[] = [];
    const segundo = esperarTurnoNominatim(ahora).then(() => salidas.push(Date.now() - inicio));
    await vi.advanceTimersByTimeAsync(10); // empieza la espera de 1000 ms
    atraso = 300;
    await vi.advanceTimersByTimeAsync(990); // despierta a los 1000 ms, pero su reloj marca 700: faltan 300
    expect(salidas).toEqual([]);
    await vi.advanceTimersByTimeAsync(300);
    await segundo;
    expect(salidas).toEqual([1300]);
  });
});
