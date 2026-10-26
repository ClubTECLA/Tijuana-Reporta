import { describe, expect, it } from 'vitest';
import type { CategoriaReporte, Reporte } from '@/types/api';
import { aplicarFiltros } from './aplicarFiltros';
import { FILTROS_POR_DEFECTO, VENTANA_PERIODO_MS } from './constantes';
import type { FiltrosMapa } from './types';

const AHORA = new Date('2026-10-13T12:00:00.000Z');

function reporte(id: string, categorias: CategoriaReporte[], haceMs = 0): Reporte {
  return {
    id,
    titulo: `Reporte ${id}`,
    categorias,
    tags: [],
    lat: 32.5,
    lng: -117,
    status: 'pendiente',
    upvotes: 0,
    user_id: 'u1',
    created_at: new Date(AHORA.getTime() - haceMs).toISOString(),
  };
}

function filtros(parcial: Partial<FiltrosMapa> = {}): FiltrosMapa {
  return {
    ...FILTROS_POR_DEFECTO,
    categorias: FILTROS_POR_DEFECTO.categorias && [...FILTROS_POR_DEFECTO.categorias],
    capas: { ...FILTROS_POR_DEFECTO.capas },
    ...parcial,
  };
}

const ids = (rs: Reporte[]) => rs.map((r) => r.id);

describe('aplicarFiltros', () => {
  it('con los filtros por defecto devuelve todo', () => {
    const rs = [reporte('a', ['inundacion']), reporte('b', ['luz', 'arbol'], 60_000)];
    expect(ids(aplicarFiltros(rs, FILTROS_POR_DEFECTO, AHORA))).toEqual(['a', 'b']);
  });

  it('coincide si al menos una categoría del reporte está activa', () => {
    const rs = [
      reporte('multi', ['inundacion', 'arbol']),
      reporte('solo-luz', ['luz']),
    ];
    const f = filtros({ categorias: ['arbol'] });
    expect(ids(aplicarFiltros(rs, f, AHORA))).toEqual(['multi']);
  });

  it('con todas las categorías apagadas devuelve vacío', () => {
    const rs = [reporte('a', ['inundacion']), reporte('b', ['otro'])];
    expect(aplicarFiltros(rs, filtros({ categorias: [] }), AHORA)).toEqual([]);
  });

  describe('período (borde inclusivo)', () => {
    for (const periodo of ['ahora', '24h', '7d'] as const) {
      const ventana = VENTANA_PERIODO_MS[periodo];
      it(`${periodo}: justo en el borde entra, 1 ms más viejo sale`, () => {
        const rs = [
          reporte('dentro', ['luz'], ventana - 1),
          reporte('borde', ['luz'], ventana),
          reporte('fuera', ['luz'], ventana + 1),
        ];
        const res = aplicarFiltros(rs, filtros({ periodo }), AHORA);
        expect(ids(res)).toEqual(['dentro', 'borde']);
      });
    }

    it('las ventanas son 2 h, 24 h y 7 días', () => {
      expect(VENTANA_PERIODO_MS).toEqual({
        ahora: 2 * 3_600_000,
        '24h': 24 * 3_600_000,
        '7d': 7 * 24 * 3_600_000,
      });
    });
  });

  describe('fecha inválida', () => {
    const sinFecha = { ...reporte('sin-fecha', ['luz']), created_at: 'no-es-una-fecha' };
    const vacia = { ...reporte('vacia', ['luz']), created_at: '' };

    for (const periodo of ['ahora', '24h', '7d'] as const) {
      it(`${periodo}: un reporte con created_at no interpretable se excluye`, () => {
        const rs = [reporte('valido', ['luz']), sinFecha, vacia];
        expect(ids(aplicarFiltros(rs, filtros({ periodo }), AHORA))).toEqual(['valido']);
      });
    }
  });

  it('con la capa incidentes apagada devuelve vacío', () => {
    const rs = [reporte('a', ['inundacion'])];
    const f = filtros({ capas: { ...FILTROS_POR_DEFECTO.capas, incidentes: false } });
    expect(aplicarFiltros(rs, f, AHORA)).toEqual([]);
  });

  it('zonasRiesgo y avisosOficiales no alteran el resultado', () => {
    const rs = [reporte('a', ['inundacion']), reporte('b', ['luz'], 3 * 3_600_000)];
    const base = ids(aplicarFiltros(rs, FILTROS_POR_DEFECTO, AHORA));
    const f = filtros({
      capas: { incidentes: true, zonasRiesgo: false, avisosOficiales: false },
    });
    expect(ids(aplicarFiltros(rs, f, AHORA))).toEqual(base);
  });

  describe('categorías: null significa "todas" sin conocer la lista', () => {
    it('por defecto es null y muestra cualquier categoría, incluidas las nuevas del backend', () => {
      expect(FILTROS_POR_DEFECTO.categorias).toBeNull();
      const rs = [reporte('a', ['incendio']), reporte('b', ['categoria-futura']), reporte('c', ['luz'])];
      expect(ids(aplicarFiltros(rs, FILTROS_POR_DEFECTO, AHORA))).toEqual(['a', 'b', 'c']);
    });

    it('un subconjunto explícito filtra, incluso por una categoría nueva', () => {
      const rs = [reporte('a', ['incendio']), reporte('b', ['luz'])];
      expect(ids(aplicarFiltros(rs, filtros({ categorias: ['incendio'] }), AHORA))).toEqual(['a']);
    });
  });

  describe('reportes solo con categorías sin chip (otro, desconocidas)', () => {
    const rs = [reporte('fuera', ['peligro', 'servicios', 'otro'])];

    it('son visibles con "todas" (null)', () => {
      expect(ids(aplicarFiltros(rs, filtros({ categorias: null }), AHORA))).toEqual(['fuera']);
    });

    it('se ocultan en cuanto se elige un subconjunto', () => {
      expect(aplicarFiltros(rs, filtros({ categorias: ['arbol', 'socavon'] }), AHORA)).toEqual([]);
    });

    it('un reporte mixto (picker + fuera) se decide por su categoría del picker', () => {
      const mixto = [reporte('mixto', ['peligro', 'luz'])];
      expect(ids(aplicarFiltros(mixto, filtros({ categorias: ['luz'] }), AHORA))).toEqual(['mixto']);
      expect(aplicarFiltros(mixto, filtros({ categorias: ['arbol'] }), AHORA)).toEqual([]);
    });
  });

  it('no muta la entrada', () => {
    const rs = [reporte('a', ['inundacion']), reporte('b', ['luz'], 9_999_999_999)];
    const f = filtros({ categorias: ['luz'] });
    const rsAntes = JSON.stringify(rs);
    const fAntes = JSON.stringify(f);
    const res = aplicarFiltros(rs, f, AHORA);
    expect(res).not.toBe(rs);
    expect(JSON.stringify(rs)).toBe(rsAntes);
    expect(JSON.stringify(f)).toBe(fAntes);
  });

  it('un reporte sin categorías no rompe (se trata como fuera del picker)', () => {
    const rs = [reporte('vacio', [])];
    expect(ids(aplicarFiltros(rs, FILTROS_POR_DEFECTO, AHORA))).toEqual(['vacio']);
    expect(aplicarFiltros(rs, filtros({ categorias: ['luz'] }), AHORA)).toEqual([]);
  });
});
