import { describe, expect, it } from 'vitest';
import { CENTRO_TIJUANA, LIMITE_LISTA, RADIO_LISTA_M, rutaCercanos } from './cercanos';

describe('rutaCercanos', () => {
  it('pide todo Tijuana con lat, lng, radio y límite, sin desde', () => {
    const ruta = rutaCercanos();
    expect(ruta.startsWith('/reportes/cercanos?')).toBe(true);
    const q = new URLSearchParams(ruta.split('?')[1]);
    expect(q.get('lat')).toBe(String(CENTRO_TIJUANA.lat));
    expect(q.get('lng')).toBe(String(CENTRO_TIJUANA.lng));
    expect(q.get('radio')).toBe(String(RADIO_LISTA_M));
    expect(q.get('limite')).toBe(String(LIMITE_LISTA));
    expect(q.has('desde')).toBe(false);
  });

  it('agrega desde codificado cuando se manda', () => {
    const ruta = rutaCercanos('2026-10-22T10:00:00.000Z');
    expect(ruta).toContain('desde=2026-10-22T10%3A00%3A00.000Z');
    expect(new URLSearchParams(ruta.split('?')[1]).get('desde')).toBe('2026-10-22T10:00:00.000Z');
  });

  it('respeta los límites del contrato', () => {
    expect(RADIO_LISTA_M).toBeLessThanOrEqual(50000);
    expect(LIMITE_LISTA).toBeLessThanOrEqual(500);
  });
});
