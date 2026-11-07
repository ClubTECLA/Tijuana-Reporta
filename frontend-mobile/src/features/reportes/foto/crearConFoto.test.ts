import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/lib/http';
import type { CrearReporteRequest, Reporte } from '@/types/api';
import { crearConFoto } from './crearConFoto';

const REPORTE: Reporte = {
  id: 'r-1',
  titulo: 'Bache',
  categorias: ['socavon'],
  tags: [],
  lat: 32.5,
  lng: -117,
  status: 'pendiente',
  upvotes: 0,
  user_id: 'u-1',
  created_at: '2026-10-25T00:00:00.000Z',
};

const REQ: CrearReporteRequest = { titulo: 'Bache', categorias: ['socavon'], tags: [], lat: 32.5, lng: -117 };
const FOTO = 'file:///cache/foto.jpg';
const URL_PUBLICA = 'http://localhost/multimedia/reportes/r-1/abc.jpg';

const api = (opciones: { crear?: () => Promise<Reporte>; subir?: () => Promise<string> } = {}) => ({
  crear: vi.fn(opciones.crear ?? (async () => REPORTE)),
  subirFoto: vi.fn(opciones.subir ?? (async () => URL_PUBLICA)),
});

describe('crearConFoto', () => {
  it('sin foto solo crea el reporte', async () => {
    const a = api();

    const resultado = await crearConFoto(a, REQ, null);

    expect(a.subirFoto).not.toHaveBeenCalled();
    expect(resultado).toEqual({ reporte: REPORTE, errorFoto: null });
  });

  it('con foto crea el reporte y después sube la foto a ese reporte', async () => {
    const a = api();

    await crearConFoto(a, REQ, FOTO);

    expect(a.subirFoto).toHaveBeenCalledWith('r-1', FOTO);
    expect(a.crear.mock.invocationCallOrder[0]).toBeLessThan(a.subirFoto.mock.invocationCallOrder[0]);
  });

  it('devuelve el reporte con la URL pública de la foto subida', async () => {
    const resultado = await crearConFoto(api(), REQ, FOTO);

    expect(resultado.reporte.image_url).toBe(URL_PUBLICA);
    expect(resultado.errorFoto).toBeNull();
  });

  it('si la foto falla, el reporte sigue creado y se avisa del error', async () => {
    const a = api({
      subir: async () => {
        throw new ApiError(503, 'x');
      },
    });

    const resultado = await crearConFoto(a, REQ, FOTO);

    expect(resultado.reporte).toEqual(REPORTE);
    expect(resultado.errorFoto?.mensaje).toContain('no está disponible');
  });

  it('marca el fallo como reintentable cuando la causa es pasajera (503)', async () => {
    const a = api({
      subir: async () => {
        throw new ApiError(503, 'x');
      },
    });

    expect((await crearConFoto(a, REQ, FOTO)).errorFoto?.reintentable).toBe(true);
  });

  it('marca el fallo como NO reintentable cuando reenviar la foto fallaría igual (409)', async () => {
    const a = api({
      subir: async () => {
        throw new ApiError(409, 'x');
      },
    });

    expect((await crearConFoto(a, REQ, FOTO)).errorFoto?.reintentable).toBe(false);
  });

  it('si crear falla, propaga el error y no intenta subir la foto', async () => {
    const a = api({
      crear: async () => {
        throw new ApiError(400, 'x');
      },
    });

    await expect(crearConFoto(a, REQ, FOTO)).rejects.toBeInstanceOf(ApiError);
    expect(a.subirFoto).not.toHaveBeenCalled();
  });
});
