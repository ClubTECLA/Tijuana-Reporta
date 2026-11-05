import { beforeEach, describe, expect, it, vi } from 'vitest';

const observar = vi.hoisted(() => vi.fn());

vi.mock('expo-location', () => ({
  watchPositionAsync: observar,
  requestForegroundPermissionsAsync: vi.fn(),
  getForegroundPermissionsAsync: vi.fn(),
  getLastKnownPositionAsync: vi.fn(),
  getCurrentPositionAsync: vi.fn(),
  Accuracy: { Balanced: 3 },
}));
vi.mock('@/lib/env', () => ({ env: { useMocks: false } }));

import { seguirPosicion } from './ubicacion';

type AlFix = (fix: { coords: { latitude: number; longitude: number } }) => void;

describe('seguirPosicion', () => {
  let alFix: AlFix;
  const quitar = vi.fn();

  beforeEach(() => {
    quitar.mockReset();
    observar.mockReset();
    observar.mockImplementation(async (_opciones: unknown, callback: AlFix) => {
      alFix = callback;
      return { remove: quitar };
    });
  });

  it('entrega cada fix nuevo como coordenadas', async () => {
    const recibidas: unknown[] = [];
    await seguirPosicion((posicion) => recibidas.push(posicion));

    alFix({ coords: { latitude: 32.5, longitude: -117.0 } });
    alFix({ coords: { latitude: 32.51, longitude: -117.01 } });

    expect(recibidas).toEqual([
      { lat: 32.5, lng: -117.0 },
      { lat: 32.51, lng: -117.01 },
    ]);
  });

  it('pide un fix cada ~10 m con precisión equilibrada, para no gastar batería de más', async () => {
    await seguirPosicion(() => undefined);

    expect(observar).toHaveBeenCalledWith(
      expect.objectContaining({ accuracy: 3, distanceInterval: 10 }),
      expect.any(Function),
    );
  });

  it('devuelve una función que cancela el seguimiento', async () => {
    const cancelar = await seguirPosicion(() => undefined);
    expect(quitar).not.toHaveBeenCalled();

    cancelar();

    expect(quitar).toHaveBeenCalledTimes(1);
  });
});
