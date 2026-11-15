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
});
