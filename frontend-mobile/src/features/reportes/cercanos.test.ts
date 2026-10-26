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

  it('con centro y radio propios los usa en lugar de "toda Tijuana", conservando desde y límite', () => {
    const ruta = rutaCercanos('2026-10-22T10:00:00.000Z', { centro: { lat: 32.52, lng: -117.01 }, radioM: 300 });
    const q = new URLSearchParams(ruta.split('?')[1]);
    expect(q.get('lat')).toBe('32.52');
    expect(q.get('lng')).toBe('-117.01');
    expect(q.get('radio')).toBe('300');
    expect(q.get('desde')).toBe('2026-10-22T10:00:00.000Z');
    expect(q.get('limite')).toBe(String(LIMITE_LISTA));
  });

  it('una zona a medias (solo centro o solo radio) completa lo que falta con los valores de la lista general', () => {
    const soloRadio = new URLSearchParams(rutaCercanos(undefined, { radioM: 300 }).split('?')[1]);
    expect(soloRadio.get('radio')).toBe('300');
    expect(soloRadio.get('lat')).toBe(String(CENTRO_TIJUANA.lat));
    const soloCentro = new URLSearchParams(
      rutaCercanos(undefined, { centro: { lat: 32.52, lng: -117.01 } }).split('?')[1],
    );
    expect(soloCentro.get('lat')).toBe('32.52');
    expect(soloCentro.get('radio')).toBe(String(RADIO_LISTA_M));
  });

  it('respeta los límites del contrato', () => {
    expect(RADIO_LISTA_M).toBeLessThanOrEqual(50000);
    expect(LIMITE_LISTA).toBeLessThanOrEqual(500);
  });
});
