import { describe, expect, it } from 'vitest';
import { ICONOS_LOCALES, resolverCategoria, type CategoriaUI } from './categorias';
import { ICONOS_CATEGORIA, iconoSvg, pinturaDeIcono } from './iconosCategoria';

const SLUGS = [...ICONOS_LOCALES, 'generico'] as const;

describe('iconosCategoria', () => {
  it.each(SLUGS)('%s tiene viewBox válido y al menos un path', (slug) => {
    const { viewBox, paths } = ICONOS_CATEGORIA[slug];
    const medidas = viewBox.split(' ').map(Number);
    expect(medidas).toHaveLength(4);
    expect(medidas.every(Number.isFinite)).toBe(true);
    expect(medidas[2]).toBeGreaterThan(0);
    expect(medidas[3]).toBeGreaterThan(0);
    expect(paths.length).toBeGreaterThan(0);
    expect(paths.every((d) => /^[Mm]/.test(d))).toBe(true);
  });

  it('cubre las siete categorías del catálogo del backend, incendio incluido', () => {
    expect([...ICONOS_LOCALES].sort()).toEqual(
      ['arbol', 'deslave', 'drenaje', 'incendio', 'inundacion', 'luz', 'socavon'].sort(),
    );
  });

  it('respeta el estilo del set de origen: Lucide va en trazo; Material y Game Icons, rellenos', () => {
    expect(ICONOS_CATEGORIA.luz.trazo).toBe(true);
    expect(ICONOS_CATEGORIA.arbol.trazo).toBe(true);
    expect(ICONOS_CATEGORIA.drenaje.trazo).toBe(true);
    expect(ICONOS_CATEGORIA.generico.trazo).toBe(true);
    expect(ICONOS_CATEGORIA.inundacion.trazo).toBe(false);
    expect(ICONOS_CATEGORIA.deslave.trazo).toBe(false);
    expect(ICONOS_CATEGORIA.incendio.trazo).toBe(false);
    expect(ICONOS_CATEGORIA.socavon.trazo).toBe(false);
  });

  it('iconoSvg devuelve el genérico para un slug desconocido', () => {
    expect(iconoSvg('otro')).toBe(ICONOS_CATEGORIA.generico);
    expect(iconoSvg(undefined)).toBe(ICONOS_CATEGORIA.generico);
    expect(iconoSvg('luz')).toBe(ICONOS_CATEGORIA.luz);
  });
});

describe('pinturaDeIcono', () => {
  it('trazo (Lucide): sin relleno, línea del color con grosor 2 y extremos redondeados', () => {
    expect(pinturaDeIcono(ICONOS_CATEGORIA.luz, '#FFFFFF')).toEqual({
      fill: 'none',
      stroke: '#FFFFFF',
      strokeWidth: 2,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    });
  });

  it('relleno (Material, Game Icons): solo relleno del color, sin línea', () => {
    expect(pinturaDeIcono(ICONOS_CATEGORIA.inundacion, '#FFFFFF')).toEqual({ fill: '#FFFFFF' });
  });
});

describe('resolverCategoria con incendio', () => {
  const catalogo: CategoriaUI[] = [{ slug: 'incendio', id: 7, etiqueta: 'Incendio', color: '#D32F2F' }];

  it('ya no cae al icono genérico', () => {
    expect(resolverCategoria('incendio', catalogo).icono).toBe('incendio');
  });
});
