import { describe, expect, it } from 'vitest';
import type { IncidenteApi } from '../mappers';
import type { CrearReporteRequest } from '@/types/api';
import { CategoriaNoDisponibleError, cuerpoCrearReporte } from './cuerpoApi';

const incidente = (id: number, nombre: string, esta_activo = true): IncidenteApi => ({
  id,
  nombre,
  etiqueta: nombre,
  tiempo_limite: 0,
  radio: 0,
  color: '#000000',
  tags: [],
  esta_activo,
});

const CATALOGO = [incidente(1, 'luz'), incidente(6, 'inundacion'), incidente(9, 'incendio', false)];

const req = (cambios: Partial<CrearReporteRequest> = {}): CrearReporteRequest => ({
  titulo: 'Inundación en Av. Revolución',
  categorias: ['inundacion'],
  tags: ['agua alta'],
  lat: 32.5149,
  lng: -117.0382,
  ...cambios,
});

describe('cuerpoCrearReporte', () => {
  it('traduce el slug de la categoría a incidente_id con el catálogo', () => {
    expect(cuerpoCrearReporte(req(), CATALOGO).incidente_id).toBe(6);
  });

  it('manda las coordenadas como latitude y longitude', () => {
    expect(cuerpoCrearReporte(req(), CATALOGO)).toMatchObject({ latitude: 32.5149, longitude: -117.0382 });
  });

  it('incluye la dirección cuando existe', () => {
    expect(cuerpoCrearReporte(req({ direccion: 'Av. Revolución 100' }), CATALOGO).direccion).toBe('Av. Revolución 100');
  });

  it('omite la dirección cuando no hay', () => {
    expect('direccion' in cuerpoCrearReporte(req(), CATALOGO)).toBe(false);
  });

  it('recorta la dirección a los 255 caracteres que acepta el backend', () => {
    const larga = 'a'.repeat(300);
    expect(cuerpoCrearReporte(req({ direccion: larga }), CATALOGO).direccion).toHaveLength(255);
  });

  it('solo manda los campos que el backend conoce (sin título, tags, foto ni es_oficial)', () => {
    const cuerpo = cuerpoCrearReporte(req({ direccion: 'x', image_base64: 'abc' }), CATALOGO);
    expect(Object.keys(cuerpo).sort()).toEqual(['direccion', 'incidente_id', 'latitude', 'longitude']);
  });

  it('usa la primera categoría: el backend guarda un solo incidente por reporte', () => {
    expect(cuerpoCrearReporte(req({ categorias: ['luz', 'inundacion'] }), CATALOGO).incidente_id).toBe(1);
  });

  it('falla si la categoría no está en el catálogo', () => {
    expect(() => cuerpoCrearReporte(req({ categorias: ['otro'] }), CATALOGO)).toThrow(CategoriaNoDisponibleError);
  });

  it('falla si la categoría está inactiva en el catálogo', () => {
    expect(() => cuerpoCrearReporte(req({ categorias: ['incendio'] }), CATALOGO)).toThrow(CategoriaNoDisponibleError);
  });

  it('falla si no se eligió ninguna categoría', () => {
    expect(() => cuerpoCrearReporte(req({ categorias: [] }), CATALOGO)).toThrow(CategoriaNoDisponibleError);
  });
});
