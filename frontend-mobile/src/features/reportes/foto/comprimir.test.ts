import { describe, expect, it, vi } from 'vitest';
import {
  CALIDAD_INICIAL,
  CALIDAD_MIN,
  comprimirHastaCaber,
  FotoMuyPesadaError,
  PESO_MAX_BYTES,
} from './comprimir';

// Simula un compresor cuyo peso depende de la calidad: a más calidad, más bytes.
const compresor = (pesoPorCalidad: (calidad: number) => number) => {
  const pesos = new Map<string, number>();
  const comprimir = vi.fn(async (calidad: number) => {
    const uri = `file:///foto-${calidad.toFixed(2)}.jpg`;
    pesos.set(uri, pesoPorCalidad(calidad));
    return uri;
  });
  const pesoDe = vi.fn(async (uri: string) => pesos.get(uri) as number);
  return { comprimir, pesoDe };
};

describe('comprimirHastaCaber', () => {
  it('se queda con el primer intento si ya cabe', async () => {
    const { comprimir, pesoDe } = compresor(() => PESO_MAX_BYTES - 1);

    const uri = await comprimirHastaCaber(comprimir, pesoDe);

    expect(comprimir).toHaveBeenCalledTimes(1);
    expect(comprimir).toHaveBeenCalledWith(CALIDAD_INICIAL);
    expect(uri).toBe(`file:///foto-${CALIDAD_INICIAL.toFixed(2)}.jpg`);
  });

  it('acepta una foto que pesa justo el máximo', async () => {
    const { comprimir, pesoDe } = compresor(() => PESO_MAX_BYTES);

    await comprimirHastaCaber(comprimir, pesoDe);

    expect(comprimir).toHaveBeenCalledTimes(1);
  });

  it('baja la calidad hasta que cabe', async () => {
    // Pesa de más mientras la calidad sea mayor que 0.55.
    const { comprimir, pesoDe } = compresor((q) => (q > 0.55 ? PESO_MAX_BYTES + 1 : PESO_MAX_BYTES - 1));

    const uri = await comprimirHastaCaber(comprimir, pesoDe);

    const calidades = comprimir.mock.calls.map(([q]) => q);
    expect(calidades[0]).toBe(CALIDAD_INICIAL);
    expect(calidades.every((q, i) => i === 0 || q < calidades[i - 1])).toBe(true);
    expect(uri).toBe(`file:///foto-${calidades[calidades.length - 1].toFixed(2)}.jpg`);
  });

  it('falla si ni con la calidad mínima cabe', async () => {
    const { comprimir, pesoDe } = compresor(() => PESO_MAX_BYTES + 1);

    await expect(comprimirHastaCaber(comprimir, pesoDe)).rejects.toBeInstanceOf(FotoMuyPesadaError);
  });

  it('nunca comprime por debajo de la calidad mínima', async () => {
    const { comprimir, pesoDe } = compresor(() => PESO_MAX_BYTES + 1);

    await comprimirHastaCaber(comprimir, pesoDe).catch(() => undefined);

    const calidades = comprimir.mock.calls.map(([q]) => q);
    expect(Math.min(...calidades)).toBeGreaterThanOrEqual(CALIDAD_MIN);
    expect(calidades[calidades.length - 1]).toBeCloseTo(CALIDAD_MIN, 5);
  });

  it('respeta un peso máximo distinto cuando se pide', async () => {
    const { comprimir, pesoDe } = compresor((q) => q * 1000);

    await comprimirHastaCaber(comprimir, pesoDe, { pesoMaxBytes: 500 });

    const calidades = comprimir.mock.calls.map(([q]) => q);
    expect(calidades[calidades.length - 1] * 1000).toBeLessThanOrEqual(500);
  });
});
