import { describe, expect, it } from 'vitest';
import { ICONOS_LOCALES, resolverCategoria, type CategoriaUI } from './categorias';
import { ICONOS_CATEGORIA, iconoSvg, pinturaDeIcono, transformDeIcono } from './iconosCategoria';

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

describe('transformDeIcono', () => {
  const icono24 = { viewBox: '0 0 24 24', trazo: false, paths: ['M0 0'] };

  it('escala el viewBox al tamaño pedido y lo coloca en (x, y) del canvas', () => {
    expect(transformDeIcono(icono24, 35, 40, 24)).toBe('translate(35 40) scale(1)');
    expect(transformDeIcono(icono24, 35, 35, 12)).toBe('translate(35 35) scale(0.5)');
  });

  it('un viewBox de 512 se reduce a la medida pedida', () => {
    const icono512 = { viewBox: '0 0 512 512', trazo: false, paths: ['M0 0'] };
    expect(transformDeIcono(icono512, 0, 0, 64)).toBe('translate(0 0) scale(0.125)');
  });

  it('compensa un viewBox que no empieza en el origen', () => {
    const desplazado = { viewBox: '10 20 24 24', trazo: false, paths: ['M0 0'] };
    expect(transformDeIcono(desplazado, 0, 0, 24)).toBe('translate(-10 -20) scale(1)');
  });
});

describe('resolverCategoria con incendio', () => {
  const catalogo: CategoriaUI[] = [{ slug: 'incendio', id: 7, etiqueta: 'Incendio', color: '#D32F2F' }];

  it('ya no cae al icono genérico', () => {
    expect(resolverCategoria('incendio', catalogo).icono).toBe('incendio');
  });
});
