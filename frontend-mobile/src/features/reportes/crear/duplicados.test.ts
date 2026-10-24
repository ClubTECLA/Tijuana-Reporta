import { describe, expect, it } from 'vitest';
import { RADIO_BUSQUEDA_DUPLICADO_M, RADIO_DUPLICADO_M, VENTANA_DUPLICADO_MS, desdeDuplicados } from './duplicados';

describe('RADIO_BUSQUEDA_DUPLICADO_M', () => {
  it('acota la consulta al servidor pero deja margen sobre el radio exacto que filtra el cliente', () => {
    expect(RADIO_BUSQUEDA_DUPLICADO_M).toBeGreaterThan(RADIO_DUPLICADO_M);
    expect(RADIO_BUSQUEDA_DUPLICADO_M).toBeLessThanOrEqual(1000);
  });
});

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
