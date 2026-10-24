import { describe, expect, it } from 'vitest';
import { VENTANA_DUPLICADO_MS, desdeDuplicados } from './duplicados';

describe('desdeDuplicados', () => {
  it('es el instante seis horas antes de "ahora", en ISO', () => {
    const ahora = new Date('2026-10-23T18:00:00.000Z');
    expect(desdeDuplicados(ahora)).toBe('2026-10-23T12:00:00.000Z');
  });

  it('usa la misma ventana con la que buscarDuplicado descarta reportes viejos', () => {
    const ahora = new Date('2026-10-23T18:00:00.000Z');
    expect(ahora.getTime() - new Date(desdeDuplicados(ahora)).getTime()).toBe(VENTANA_DUPLICADO_MS);
  });
});
