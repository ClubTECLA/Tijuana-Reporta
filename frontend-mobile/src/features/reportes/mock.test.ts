import { describe, expect, it } from 'vitest';
import { distanciaMetros } from '@/lib/geo';
import { reportesMock } from './mock';

// Zona Río (UBICACION_SIMULADA): a ~90 m del reporte "Árbol caído sobre cableado".
const PUNTO = { lat: 32.5262, lng: -117.0203 };

describe('reportesMock.cercanos', () => {
  it('devuelve solo activos dentro del radio, del más cercano al más lejano', async () => {
    const todos = await reportesMock.listar();
    const zonas = await reportesMock.cercanos(PUNTO.lat, PUNTO.lng, 5000);
    const distancias = zonas.map((z) => distanciaMetros(PUNTO, z));

    expect(zonas.length).toBeGreaterThan(0);
    expect(distancias.every((d) => d <= 5000)).toBe(true);
    expect(distancias).toEqual([...distancias].sort((a, b) => a - b));
    const resueltos = new Set(todos.filter((r) => r.status === 'resuelto').map((r) => r.id));
    expect(zonas.some((z) => resueltos.has(z.id))).toBe(false);
  });

  it('con un radio chico solo queda el reporte de al lado', async () => {
    const zonas = await reportesMock.cercanos(PUNTO.lat, PUNTO.lng, 150);
    expect(zonas.map((z) => z.titulo)).toEqual(['Árbol caído sobre cableado']);
  });
});
