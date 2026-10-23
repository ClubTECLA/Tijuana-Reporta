import { describe, expect, it } from 'vitest';
import { colors } from '@/theme/colors';
import type { IncidenteApi } from '../reportes/mappers';
import {
  CATEGORIAS_RESPALDO,
  categoriasDeCatalogo,
  resolverCategoria,
  type CategoriaUI,
} from './categorias';

function incidente(id: number, nombre: string, etiqueta: string, color: string, activo = true): IncidenteApi {
  return { id, nombre, etiqueta, tiempo_limite: 60, radio: 100, color, tags: [], esta_activo: activo };
}

describe('categoriasDeCatalogo', () => {
  it('mapea slug, id, etiqueta y color del backend', () => {
    expect(categoriasDeCatalogo([incidente(1, 'luz', 'Luz', '#F5C518')])).toEqual([
      { slug: 'luz', id: 1, etiqueta: 'Luz', color: '#F5C518' },
    ]);
  });

  it('descarta los incidentes inactivos', () => {
    const lista = categoriasDeCatalogo([
      incidente(1, 'luz', 'Luz', '#F5C518'),
      incidente(2, 'socavon', 'Socavón', '#8D6E63', false),
    ]);
    expect(lista.map((c) => c.slug)).toEqual(['luz']);
  });

  it('conserva el orden del backend (por id), sin reordenar alfabéticamente', () => {
    const lista = categoriasDeCatalogo([
      incidente(3, 'arbol', 'Árbol', '#2E7D32'),
      incidente(1, 'luz', 'Luz', '#F5C518'),
      incidente(2, 'socavon', 'Socavón', '#8D6E63'),
    ]);
    expect(lista.map((c) => c.id)).toEqual([1, 2, 3]);
  });

  it('no muta la entrada', () => {
    const entrada = [incidente(2, 'b', 'B', '#000000'), incidente(1, 'a', 'A', '#111111')];
    const antes = JSON.stringify(entrada);
    categoriasDeCatalogo(entrada);
    expect(JSON.stringify(entrada)).toBe(antes);
  });

  it('un catálogo vacío da una lista vacía', () => {
    expect(categoriasDeCatalogo([])).toEqual([]);
  });
});

describe('CATEGORIAS_RESPALDO', () => {
  it('son las 6 categorías del picker con los colores del backend', () => {
    expect(CATEGORIAS_RESPALDO.map((c) => c.slug)).toEqual([
      'inundacion',
      'deslave',
      'drenaje',
      'arbol',
      'socavon',
      'luz',
    ]);
    expect(CATEGORIAS_RESPALDO.find((c) => c.slug === 'luz')?.color).toBe('#F5C518');
    expect(CATEGORIAS_RESPALDO.find((c) => c.slug === 'arbol')?.etiqueta).toBe('Árbol');
  });
});

describe('resolverCategoria', () => {
  const catalogo: CategoriaUI[] = [
    { slug: 'luz', id: 1, etiqueta: 'Luz', color: '#F5C518' },
    { slug: 'incendio', id: 7, etiqueta: 'Incendio', color: '#D32F2F' },
  ];

  it('categoría del catálogo con icono local: etiqueta y color del backend, icono propio', () => {
    expect(resolverCategoria('luz', catalogo)).toEqual({ etiqueta: 'Luz', color: '#F5C518', icono: 'luz' });
  });

  it('la etiqueta y el color salen del catálogo, no de una paleta local', () => {
    const otro: CategoriaUI[] = [{ slug: 'luz', id: 1, etiqueta: 'Alumbrado', color: '#123456' }];
    expect(resolverCategoria('luz', otro)).toEqual({ etiqueta: 'Alumbrado', color: '#123456', icono: 'luz' });
  });

  it('categoría del catálogo sin icono local (incendio): color del backend e icono genérico', () => {
    expect(resolverCategoria('incendio', catalogo)).toEqual({
      etiqueta: 'Incendio',
      color: '#D32F2F',
      icono: 'generico',
    });
  });

  it('"otro" cae en Otro / gris neutro / icono genérico', () => {
    expect(resolverCategoria('otro', catalogo)).toEqual({
      etiqueta: 'Otro',
      color: colors.textMuted,
      icono: 'generico',
    });
  });

  it('un slug desconocido o ausente cae en el mismo respaldo', () => {
    const respaldo = { etiqueta: 'Otro', color: colors.textMuted, icono: 'generico' };
    expect(resolverCategoria('marciano', catalogo)).toEqual(respaldo);
    expect(resolverCategoria(undefined, catalogo)).toEqual(respaldo);
  });

  it('con catálogo vacío también cae en el respaldo', () => {
    expect(resolverCategoria('luz', [])).toEqual({ etiqueta: 'Otro', color: colors.textMuted, icono: 'generico' });
  });
});
