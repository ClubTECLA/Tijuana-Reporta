import { describe, expect, it } from 'vitest';
import { avisoDeReportes, type EntradaAviso } from './avisos';

const base: EntradaAviso = {
  hayDatos: true,
  vacia: false,
  isError: false,
  errorDeRed: false,
  enLinea: true,
  periodo: '7d',
  sinCoincidencias: false,
};

describe('avisoDeReportes', () => {
  it('sin conexión: con datos y sin datos', () => {
    expect(avisoDeReportes({ ...base, enLinea: false })).toEqual({
      tipo: 'sin-conexion',
      mensaje: 'Sin conexión · mostrando los últimos reportes',
    });
    expect(avisoDeReportes({ ...base, enLinea: false, hayDatos: false })).toEqual({
      tipo: 'sin-conexion',
      mensaje: 'Sin conexión · los reportes se cargarán al reconectar',
    });
  });

  it('error: con datos, sin datos (servidor) y sin datos (red), siempre con reintentar', () => {
    expect(avisoDeReportes({ ...base, isError: true })).toEqual({
      tipo: 'error',
      mensaje: 'No se pudieron actualizar los reportes',
      conReintentar: true,
    });
    expect(avisoDeReportes({ ...base, isError: true, hayDatos: false })).toEqual({
      tipo: 'error',
      mensaje: 'No pudimos cargar los reportes',
      conReintentar: true,
    });
    expect(avisoDeReportes({ ...base, isError: true, hayDatos: false, errorDeRed: true })).toEqual({
      tipo: 'error',
      mensaje: 'No pudimos conectar con el servidor',
      conReintentar: true,
    });
  });

  it('cargando: sin datos y sin error', () => {
    expect(avisoDeReportes({ ...base, hayDatos: false })).toEqual({ tipo: 'cargando', mensaje: 'Cargando reportes…' });
  });

  it('lista vacía en "ahora": avisa de la ventana de 2 h y ofrece ampliar a 7 días', () => {
    expect(avisoDeReportes({ ...base, vacia: true, periodo: 'ahora' })).toEqual({
      tipo: 'info',
      mensaje: 'Sin reportes en las últimas 2 h',
      accion: { texto: 'Ver últimos 7 días', tipo: 'ampliar-periodo' },
    });
  });

  it('lista vacía en "24h": avisa de la ventana de 24 h y ofrece ampliar a 7 días', () => {
    expect(avisoDeReportes({ ...base, vacia: true, periodo: '24h' })).toEqual({
      tipo: 'info',
      mensaje: 'Sin reportes en las últimas 24 h',
      accion: { texto: 'Ver últimos 7 días', tipo: 'ampliar-periodo' },
    });
  });

  it('lista vacía en "7d": conserva el mensaje general y no ofrece acción', () => {
    expect(avisoDeReportes({ ...base, vacia: true, periodo: '7d' })).toEqual({
      tipo: 'info',
      mensaje: 'Aún no hay reportes en la ciudad',
    });
  });

  it('ningún reporte coincide con los filtros', () => {
    expect(avisoDeReportes({ ...base, sinCoincidencias: true })).toEqual({
      tipo: 'info',
      mensaje: 'Ningún reporte coincide con tus filtros',
    });
  });

  it('sin nada que avisar devuelve null', () => {
    expect(avisoDeReportes(base)).toBeNull();
  });

  it('error y sin conexión tienen prioridad sobre la lista vacía', () => {
    expect(avisoDeReportes({ ...base, vacia: true, periodo: 'ahora', enLinea: false })?.tipo).toBe('sin-conexion');
    expect(avisoDeReportes({ ...base, vacia: true, periodo: 'ahora', isError: true })?.tipo).toBe('error');
  });
});
