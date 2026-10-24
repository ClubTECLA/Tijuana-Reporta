import { describe, expect, it } from 'vitest';
import {
  categoriaDeIncidente,
  esRescatista,
  mapearComentario,
  mapearDetalle,
  mapearEstado,
  mapearResumen,
  origenDeApi,
  urlMultimedia,
  type IncidenteApi,
  type ReporteApi,
  type ReporteResumenApi,
} from './mappers';

const AHORA = new Date('2026-10-22T12:00:00.000Z');

const incidente = (id: number, nombre: string, etiqueta = nombre): IncidenteApi => ({
  id,
  nombre,
  etiqueta,
  tiempo_limite: 5,
  radio: 100,
  color: '#000000',
  tags: [],
  esta_activo: true,
});

const catalogo = [incidente(1, 'luz'), incidente(2, 'socavon'), incidente(7, 'incendio', 'Incendio')];

const resumen = (parcial: Partial<ReporteResumenApi> = {}): ReporteResumenApi => ({
  id: 'r1',
  incidente_id: 2,
  titulo: 'Socavón en Calle X',
  direccion: 'Calle X',
  estado_actual: 'Pendiente',
  avistamientos: 4,
  es_oficial: false,
  latitude: 32.5,
  longitude: -117.01,
  ...parcial,
});

describe('mapearEstado', () => {
  it.each([
    ['Pendiente', 'pendiente'],
    ['Probable', 'pendiente'],
    ['Verificado', 'en_proceso'],
    ['Resuelto', 'resuelto'],
  ])('%s -> %s', (backend, esperado) => {
    expect(mapearEstado(backend)).toBe(esperado);
  });

  it('Descartado y valores desconocidos no tienen estado (se excluyen)', () => {
    expect(mapearEstado('Descartado')).toBeNull();
    expect(mapearEstado('Otro')).toBeNull();
  });
});

describe('categoriaDeIncidente', () => {
  it('usa el nombre (slug) del incidente', () => {
    expect(categoriaDeIncidente(incidente(2, 'socavon'))).toBe('socavon');
  });

  it('una categoría que mobile no tenía hardcodeada (incendio) es su propia categoría', () => {
    expect(categoriaDeIncidente(incidente(7, 'incendio', 'Incendio'))).toBe('incendio');
  });

  it('un incidente ausente del catálogo cae en "otro"', () => {
    expect(categoriaDeIncidente(undefined)).toBe('otro');
  });
});

describe('esRescatista', () => {
  it('rescatista y protección civil son personal de atención', () => {
    expect(esRescatista('rescatista')).toBe(true);
    expect(esRescatista('proteccion_civil')).toBe(true);
  });

  it('ciudadano, otros roles y rol ausente no lo son', () => {
    expect(esRescatista('ciudadano')).toBe(false);
    expect(esRescatista('admin')).toBe(false);
    expect(esRescatista(undefined)).toBe(false);
  });
});

describe('origenDeApi / urlMultimedia', () => {
  it('quita la ruta (/api/v1) y deja esquema + host + puerto', () => {
    expect(origenDeApi('http://10.0.2.2/api/v1')).toBe('http://10.0.2.2');
    expect(origenDeApi('https://api.ejemplo.mx:8443/api/v1/')).toBe('https://api.ejemplo.mx:8443');
  });

  it('arma la URL pública de la foto sin el prefijo /api', () => {
    expect(urlMultimedia('abc/foto.jpg', 'http://10.0.2.2/api/v1')).toBe(
      'http://10.0.2.2/multimedia/abc/foto.jpg',
    );
  });

  it('tolera una barra inicial en el path', () => {
    expect(urlMultimedia('/foto.jpg', 'http://10.0.2.2/api/v1')).toBe('http://10.0.2.2/multimedia/foto.jpg');
  });
});

describe('mapearResumen', () => {
  it('traduce campos del backend al tipo Reporte de mobile', () => {
    expect(mapearResumen(resumen(), catalogo, AHORA)).toEqual({
      id: 'r1',
      titulo: 'Socavón en Calle X',
      categorias: ['socavon'],
      tags: [],
      lat: 32.5,
      lng: -117.01,
      direccion: 'Calle X',
      image_url: undefined,
      status: 'pendiente',
      upvotes: 4,
      user_id: '',
      // El resumen no trae fecha: se usa "ahora" (el período se filtra en servidor con `desde`).
      created_at: AHORA.toISOString(),
    });
  });

  it('devuelve null para un reporte Descartado', () => {
    expect(mapearResumen(resumen({ estado_actual: 'Descartado' }), catalogo, AHORA)).toBeNull();
  });
});

describe('mapearComentario', () => {
  it('autor <- username y es_rescatista <- rol_name', () => {
    const c = mapearComentario({
      id: 9,
      reporte_id: 'r1',
      user_id: 'u1',
      username: 'jose_m',
      rol_name: 'rescatista',
      comentario: 'En camino',
      created_at: '2026-10-22T10:00:00Z',
    });
    expect(c).toEqual({
      id: 9,
      reporte_id: 'r1',
      user_id: 'u1',
      autor: 'jose_m',
      es_rescatista: true,
      comentario: 'En camino',
      created_at: '2026-10-22T10:00:00Z',
    });
  });

  it('sin username el autor es "Anónimo"', () => {
    const c = mapearComentario({
      id: 1,
      reporte_id: 'r1',
      user_id: 'u1',
      comentario: 'x',
      created_at: '2026-10-22T10:00:00Z',
    });
    expect(c.autor).toBe('Anónimo');
    expect(c.es_rescatista).toBe(false);
  });
});

describe('mapearDetalle', () => {
  const detalle = (parcial: Partial<ReporteApi> = {}): ReporteApi => ({
    ...resumen(),
    es_historico: false,
    created_at: '2026-10-22T08:00:00Z',
    updated_at: '2026-10-22T09:00:00Z',
    comentarios: [],
    multimedia: [{ id: 1, path: 'a/b.jpg', user_id: 'u1', created_at: '2026-10-22T08:00:00Z' }],
    tags: [
      { id: 1, nombre: 'Profundo', count: 3 },
      { id: 2, nombre: 'Peligroso', count: 1 },
    ],
    locations: [],
    ...parcial,
  });

  it('toma fecha real, tags por nombre y la primera foto como image_url', () => {
    const r = mapearDetalle(detalle(), catalogo, 'http://10.0.2.2/api/v1');
    expect(r.created_at).toBe('2026-10-22T08:00:00Z');
    expect(r.tags).toEqual(['Profundo', 'Peligroso']);
    expect(r.image_url).toBe('http://10.0.2.2/multimedia/a/b.jpg');
    expect(r.categorias).toEqual(['socavon']);
    expect(r.upvotes).toBe(4);
  });

  it('sin multimedia no hay image_url', () => {
    expect(mapearDetalle(detalle({ multimedia: [] }), catalogo, 'http://10.0.2.2/api/v1').image_url).toBeUndefined();
  });

  it('un detalle Descartado se muestra como pendiente (solo se llega por id directo)', () => {
    const r = mapearDetalle(detalle({ estado_actual: 'Descartado' }), catalogo, 'http://10.0.2.2/api/v1');
    expect(r.status).toBe('pendiente');
  });
});
