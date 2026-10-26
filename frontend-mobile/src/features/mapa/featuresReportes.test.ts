import { describe, expect, it } from 'vitest';
import type { CategoriaUI } from '@/features/categorias/categorias';
import type { Reporte } from '@/types/api';
import type { Feature } from 'geojson';
import { clusterDeFeature, featuresDeReportes, idDeFeature } from './featuresReportes';

const catalogo: CategoriaUI[] = [
  { slug: 'luz', id: 1, etiqueta: 'Luz', color: '#F5C518' },
  { slug: 'inundacion', id: 6, etiqueta: 'Inundación', color: '#1E88E5' },
];

const reporte = (id: string, cambios: Partial<Reporte> = {}): Reporte => ({
  id,
  titulo: id,
  categorias: ['luz'],
  tags: [],
  lat: 32.5,
  lng: -117.03,
  upvotes: 3,
  status: 'pendiente',
  created_at: '2026-10-23T00:00:00Z',
  user_id: '',
  ...cambios,
});

describe('featuresDeReportes', () => {
  it('arma un Feature por reporte con coordenadas [lng, lat]', () => {
    const { type, features } = featuresDeReportes([reporte('a', { lat: 32.1, lng: -117.9 })], catalogo, null);
    expect(type).toBe('FeatureCollection');
    expect(features).toHaveLength(1);
    expect(features[0].geometry).toEqual({ type: 'Point', coordinates: [-117.9, 32.1] });
  });

  it('lleva id, color del catálogo, icono y confirmaciones como texto', () => {
    const [f] = featuresDeReportes([reporte('a', { categorias: ['inundacion'], upvotes: 4 })], catalogo, null).features;
    expect(f.properties).toEqual({
      id: 'a',
      color: '#1E88E5',
      icono: 'inundacion',
      confirmaciones: '4',
      seleccionado: false,
    });
  });

  it('una categoría fuera del catálogo usa el icono genérico y el gris de respaldo', () => {
    const [f] = featuresDeReportes([reporte('a', { categorias: ['marciano'] })], catalogo, null).features;
    expect(f.properties.icono).toBe('generico');
    expect(f.properties.color).toMatch(/^#/);
  });

  it('abrevia las confirmaciones altas a 99+', () => {
    const [f] = featuresDeReportes([reporte('a', { upvotes: 250 })], catalogo, null).features;
    expect(f.properties.confirmaciones).toBe('99+');
  });

  it('marca el reporte seleccionado y lo pone al final para que se dibuje encima', () => {
    const { features } = featuresDeReportes([reporte('a'), reporte('b'), reporte('c')], catalogo, 'a');
    expect(features.map((f) => f.properties.id)).toEqual(['b', 'c', 'a']);
    expect(features.map((f) => f.properties.seleccionado)).toEqual([false, false, true]);
  });

  it('sin reportes devuelve una colección vacía', () => {
    expect(featuresDeReportes([], catalogo, null).features).toEqual([]);
  });
});

describe('idDeFeature', () => {
  it('lee el id del primer feature tocado', () => {
    expect(idDeFeature([{ type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] }, properties: { id: 'x' } }])).toBe('x');
  });

  it('devuelve null si no hay features o no traen id', () => {
    expect(idDeFeature([])).toBeNull();
    expect(idDeFeature([{ type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] }, properties: {} }])).toBeNull();
  });
});

describe('clusterDeFeature', () => {
  const grupo = (props: Record<string, unknown>, coordinates: [number, number] = [-117, 32.5]): Feature => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates },
    properties: props,
  });

  it('reconoce un grupo y devuelve su id y centro', () => {
    expect(clusterDeFeature([grupo({ cluster: true, cluster_id: 7, point_count: 3 }, [-117.1, 32.4])])).toEqual({
      clusterId: 7,
      centro: [-117.1, 32.4],
    });
  });

  it('un pin suelto no es un grupo', () => {
    expect(clusterDeFeature([grupo({ id: 'a' })])).toBeNull();
    expect(clusterDeFeature([])).toBeNull();
  });
});
