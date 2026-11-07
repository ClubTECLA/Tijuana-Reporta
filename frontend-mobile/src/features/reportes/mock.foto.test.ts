import { describe, expect, it } from 'vitest';
import { reportesMock } from './mock';

const nuevoReporte = () =>
  reportesMock.crear({ titulo: 'Bache', categorias: ['socavon'], tags: [], lat: 32.5, lng: -117 });

describe('reportesMock.subirFoto', () => {
  it('devuelve la URL de la foto y la deja en el reporte', async () => {
    const reporte = await nuevoReporte();

    const url = await reportesMock.subirFoto(reporte.id, 'file:///cache/foto.jpg');

    expect(url).toBe('file:///cache/foto.jpg');
    expect((await reportesMock.detalle(reporte.id)).image_url).toBe('file:///cache/foto.jpg');
  });

  it('falla si el reporte no existe', async () => {
    await expect(reportesMock.subirFoto('no-existe', 'file:///cache/foto.jpg')).rejects.toThrow();
  });
});

describe('reportesMock.crear', () => {
  it('crea el reporte sin foto: la foto se sube aparte', async () => {
    expect((await nuevoReporte()).image_url).toBeUndefined();
  });
});
