import { describe, expect, it, vi } from 'vitest';
import { obtenerTokenDev } from './devLogin';

const respuesta = (ok: boolean, cuerpo: unknown) =>
  ({ ok, json: async () => cuerpo }) as unknown as Response;

describe('obtenerTokenDev', () => {
  it('hace POST /auth/login con email y password y devuelve el access_token', async () => {
    const fetchFn = vi.fn().mockResolvedValue(respuesta(true, { access_token: 'jwt-123' }));
    const token = await obtenerTokenDev({
      apiUrl: 'http://10.0.2.2/api/v1',
      email: 'ana.garcia@test.com',
      password: 'secreta',
      fetchFn,
    });
    expect(token).toBe('jwt-123');
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe('http://10.0.2.2/api/v1/auth/login');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({ email: 'ana.garcia@test.com', password: 'secreta' });
  });

  it('devuelve null si el login responde error', async () => {
    const fetchFn = vi.fn().mockResolvedValue(respuesta(false, { message: 'credenciales' }));
    expect(await obtenerTokenDev({ apiUrl: 'http://x/api/v1', email: 'a', password: 'b', fetchFn })).toBeNull();
  });

  it('devuelve null si la red falla (no rompe el arranque)', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error('red'));
    expect(await obtenerTokenDev({ apiUrl: 'http://x/api/v1', email: 'a', password: 'b', fetchFn })).toBeNull();
  });
});
