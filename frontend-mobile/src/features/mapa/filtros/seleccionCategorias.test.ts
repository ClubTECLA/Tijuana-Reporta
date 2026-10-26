import { describe, expect, it } from 'vitest';
import { alternarCategoria, categoriaActiva } from './seleccionCategorias';

const TODAS = ['inundacion', 'luz', 'incendio'];

describe('categoriaActiva', () => {
  it('con null (todas) toda categoría está activa', () => {
    expect(categoriaActiva(null, 'incendio')).toBe(true);
  });
  it('con una lista, solo las incluidas', () => {
    expect(categoriaActiva(['luz'], 'luz')).toBe(true);
    expect(categoriaActiva(['luz'], 'inundacion')).toBe(false);
  });
});

describe('alternarCategoria', () => {
  it('desde "todas", apagar una deja las demás en el orden del catálogo', () => {
    expect(alternarCategoria(null, 'luz', TODAS)).toEqual(['inundacion', 'incendio']);
  });

  it('prender una apagada la suma conservando el orden del catálogo', () => {
    expect(alternarCategoria(['incendio'], 'inundacion', TODAS)).toEqual(['inundacion', 'incendio']);
  });

  it('al completar todas vuelve a null (así una categoría nueva se verá por defecto)', () => {
    expect(alternarCategoria(['inundacion', 'luz'], 'incendio', TODAS)).toBeNull();
  });

  it('se puede apagar la última (queda lista vacía, no null)', () => {
    expect(alternarCategoria(['luz'], 'luz', TODAS)).toEqual([]);
  });

  it('no muta la selección de entrada', () => {
    const sel = ['luz'];
    alternarCategoria(sel, 'inundacion', TODAS);
    expect(sel).toEqual(['luz']);
  });
});
