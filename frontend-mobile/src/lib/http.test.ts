import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// La sesión persiste en AsyncStorage (módulo nativo): aquí solo importa el token.
vi.mock('./session', () => ({ useSessionStore: { getState: () => ({ token: 'tok-123' }) } }));
vi.mock('./env', () => ({ env: { apiUrl: 'http://localhost/api/v1', useMocks: false } }));

import { ErrorRed, http } from './http';

const respuestaJson = (cuerpo: unknown, status = 200) =>
  new Response(JSON.stringify(cuerpo), { status, headers: { 'Content-Type': 'application/json' } });

const cabecerasDe = (fetchMock: ReturnType<typeof vi.fn>): Record<string, string> =>
  (fetchMock.mock.calls[0][1] as RequestInit).headers as Record<string, string>;

describe('http', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn(async () => respuestaJson({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('manda JSON por defecto', async () => {
    await http('/reportes', { method: 'POST', body: JSON.stringify({ a: 1 }) });

    expect(cabecerasDe(fetchMock)['Content-Type']).toBe('application/json');
  });

  it('siempre manda el token de la sesión', async () => {
    await http('/reportes');

    expect(cabecerasDe(fetchMock).Authorization).toBe('Bearer tok-123');
  });

  it('con un formulario NO fija el Content-Type: fetch pone el boundary del multipart', async () => {
    await http('/reportes/r-1/multimedia', { method: 'POST', body: new FormData() });

    expect(Object.keys(cabecerasDe(fetchMock)).map((k) => k.toLowerCase())).not.toContain('content-type');
  });

  it('con un formulario conserva el token', async () => {
    await http('/reportes/r-1/multimedia', { method: 'POST', body: new FormData() });

    expect(cabecerasDe(fetchMock).Authorization).toBe('Bearer tok-123');
  });

  describe('tiempo límite', () => {
    // Un fetch que nunca responde y obedece la cancelación, como el real.
    const fetchColgado = () =>
      vi.fn(
        (_url: string, init: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            init.signal?.addEventListener('abort', () => reject(new DOMException('abortado', 'AbortError')));
          }),
      );

    it('da por perdida una petición normal a los 15 s', async () => {
      vi.useFakeTimers();
      vi.stubGlobal('fetch', fetchColgado());

      const espera = expect(http('/reportes')).rejects.toBeInstanceOf(ErrorRed);
      await vi.advanceTimersByTimeAsync(15_000);

      await espera;
    });

    it('permite un tiempo límite mayor, para subir una foto con señal débil', async () => {
      vi.useFakeTimers();
      vi.stubGlobal('fetch', fetchColgado());
      let resuelta = false;

      const peticion = http('/reportes/r-1/multimedia', { method: 'POST', body: new FormData() }, { tiempoLimiteMs: 60_000 });
      peticion.catch(() => undefined).finally(() => (resuelta = true));
      await vi.advanceTimersByTimeAsync(30_000);
      expect(resuelta).toBe(false);

      await vi.advanceTimersByTimeAsync(30_000);
      await expect(peticion).rejects.toBeInstanceOf(ErrorRed);
    });
  });
});
