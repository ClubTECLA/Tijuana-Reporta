import { describe, expect, it } from 'vitest';
import {
  CATEGORIAS_PICKER,
  CATEGORIAS_VISIBLES,
  cambiarCategoria,
  categoriasDelPicker,
  categoriasVisibles,
  elegirCategoria,
  etiquetaDeCategoria,
  etiquetasDe,
} from './categorias';
import type { CategoriaUI } from '@/features/categorias/categorias';

describe('elegirCategoria (selección única)', () => {
  it('elige la categoría cuando no había ninguna', () => {
    expect(elegirCategoria([], 'luz')).toEqual(['luz']);
  });

  it('reemplaza a la anterior en vez de sumarse', () => {
    expect(elegirCategoria(['luz'], 'drenaje')).toEqual(['drenaje']);
  });

  it('tocar la ya elegida la deselecciona', () => {
    expect(elegirCategoria(['luz'], 'luz')).toEqual([]);
  });

  it('nunca devuelve más de un elemento, aunque llegue un arreglo viejo con varios', () => {
    expect(elegirCategoria(['luz', 'arbol'], 'drenaje')).toEqual(['drenaje']);
    expect(elegirCategoria(['luz', 'arbol'], 'luz')).toEqual(['luz']);
  });
});

describe('cambiarCategoria', () => {
  it('al elegir agrega la etiqueta principal de la categoría', () => {
    expect(cambiarCategoria({ categorias: [], tags: [] }, 'luz')).toEqual({
      categorias: ['luz'],
      tags: ['sin luz'],
    });
  });

  it('al cambiar descarta las etiquetas de la anterior y conserva las ajenas a cualquier categoría', () => {
    const r = cambiarCategoria({ categorias: ['luz'], tags: ['sin luz', 'apagón', 'otra'] }, 'drenaje');
    expect(r.categorias).toEqual(['drenaje']);
    expect(r.tags).toEqual(['otra', 'drenaje tapado']);
  });

  it('al deseleccionar quita las etiquetas de la categoría', () => {
    expect(cambiarCategoria({ categorias: ['luz'], tags: ['sin luz', 'apagón'] }, 'luz')).toEqual({
      categorias: [],
      tags: [],
    });
  });

  it('no duplica la etiqueta principal si ya estaba', () => {
    const r = cambiarCategoria({ categorias: [], tags: ['sin luz'] }, 'luz');
    expect(r.tags).toEqual(['sin luz']);
  });

  it('las etiquetas de la nueva categoría que ya estaban activas se conservan', () => {
    const r = cambiarCategoria({ categorias: ['luz'], tags: ['sin luz'] }, 'inundacion');
    expect(r.tags).toEqual(['inundación']);
    expect(etiquetasDe('inundacion').map((e) => e.id)).toContain('inundación');
  });
});

describe('categoriasVisibles', () => {
  const base = CATEGORIAS_PICKER.slice(0, CATEGORIAS_VISIBLES);

  it('sin elegida o con una elegida dentro de la grilla, no cambia nada', () => {
    expect(categoriasVisibles([])).toEqual(base);
    expect(categoriasVisibles(['deslave'])).toEqual(base);
  });

  it('si la elegida está fuera de la grilla, ocupa el último lugar para seguir visible', () => {
    const r = categoriasVisibles(['drenaje']);
    expect(r).toHaveLength(CATEGORIAS_VISIBLES);
    expect(r).toEqual([...base.slice(0, CATEGORIAS_VISIBLES - 1), 'drenaje']);
  });
});

const cat = (slug: string, id: number): CategoriaUI => ({ slug, id, etiqueta: slug, color: '#000000' });
// Catálogo del backend (por id): luz, socavón, árbol, drenaje, deslave, inundación e incendio.
const CATALOGO = [cat('luz', 1), cat('socavon', 2), cat('arbol', 3), cat('drenaje', 4), cat('deslave', 5), cat('inundacion', 6), cat('incendio', 7)];

describe('categoriasDelPicker', () => {
  it('las del Figma van primero y en su orden; las demás del catálogo, después', () => {
    expect(categoriasDelPicker(CATALOGO)).toEqual(['inundacion', 'deslave', 'arbol', 'socavon', 'luz', 'drenaje', 'incendio']);
  });

  it('incendio, que el catálogo trae y el Figma no, aparece en el picker', () => {
    expect(categoriasDelPicker(CATALOGO)).toContain('incendio');
  });

  it('una categoría nueva del backend se agrega al final, sin tocar el código', () => {
    expect(categoriasDelPicker([...CATALOGO, cat('ruido', 8)]).at(-1)).toBe('ruido');
  });

  it('si el catálogo ya no trae una del Figma, no se ofrece', () => {
    const sinDeslave = CATALOGO.filter((c) => c.slug !== 'deslave');
    expect(categoriasDelPicker(sinDeslave)).not.toContain('deslave');
  });

  it('no repite categorías', () => {
    const lista = categoriasDelPicker(CATALOGO);
    expect(new Set(lista).size).toBe(lista.length);
  });
});

describe('categoriasVisibles con la lista del catálogo', () => {
  const lista = categoriasDelPicker(CATALOGO);

  it('una elegida de "+ Ver mas" como incendio ocupa el último lugar de la grilla', () => {
    expect(categoriasVisibles(['incendio'], lista)).toEqual([...lista.slice(0, CATEGORIAS_VISIBLES - 1), 'incendio']);
  });
});

describe('etiquetaDeCategoria', () => {
  it('incendio tiene etiqueta propia', () => {
    expect(etiquetaDeCategoria('incendio')).toBe('Incendio');
  });

  it('un slug desconocido no rompe: usa el slug con mayúscula inicial', () => {
    expect(etiquetaDeCategoria('ruido')).toBe('Ruido');
  });
});
