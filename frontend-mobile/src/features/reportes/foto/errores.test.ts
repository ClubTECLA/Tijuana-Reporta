import { describe, expect, it } from 'vitest';
import { ApiError, ErrorRed } from '@/lib/http';
import { FotoMuyPesadaError } from './comprimir';
import { esFotoReintentable, mensajePrepararFoto, mensajeSubidaFoto } from './errores';

describe('mensajePrepararFoto', () => {
  it('explica que la foto pesa demasiado aun comprimida', () => {
    expect(mensajePrepararFoto(new FotoMuyPesadaError())).toContain('pesada');
  });

  it('da un mensaje genérico ante cualquier otro fallo del dispositivo', () => {
    expect(mensajePrepararFoto(new Error('boom'))).toContain('No se pudo preparar la foto');
  });
});

describe('mensajeSubidaFoto', () => {
  it.each([
    [400, 'formato'],
    [404, 'creó el reporte'],
    [409, 'ya tiene'],
    [413, 'pesa demasiado'],
    [422, 'dimensiones'],
    [503, 'no está disponible'],
  ])('explica el estado %i', (status, fragmento) => {
    expect(mensajeSubidaFoto(new ApiError(status, 'x'))).toContain(fragmento);
  });

  it('explica una sesión vencida', () => {
    expect(mensajeSubidaFoto(new ApiError(401, 'x'))).toContain('sesión');
  });

  it('explica la falta de conexión', () => {
    expect(mensajeSubidaFoto(new ErrorRed())).toContain('conexión');
  });

  it('da un mensaje genérico ante un error desconocido', () => {
    expect(mensajeSubidaFoto(new Error('boom'))).toContain('No se pudo subir la foto');
  });

  it('no filtra el mensaje técnico del servidor', () => {
    expect(mensajeSubidaFoto(new ApiError(500, 'pq: connection refused'))).not.toContain('pq:');
  });
});

describe('esFotoReintentable', () => {
  it('reintenta ante servicio caído (503)', () => {
    expect(esFotoReintentable(new ApiError(503, 'x'))).toBe(true);
  });

  it('reintenta ante falta de conexión', () => {
    expect(esFotoReintentable(new ErrorRed())).toBe(true);
  });

  it.each([400, 404, 409, 413, 422])('no reintenta el estado %i: volver a enviar lo mismo falla igual', (status) => {
    expect(esFotoReintentable(new ApiError(status, 'x'))).toBe(false);
  });

  it('no reintenta un error desconocido', () => {
    expect(esFotoReintentable(new Error('boom'))).toBe(false);
  });
});
