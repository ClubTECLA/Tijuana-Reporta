import { beforeEach, describe, expect, it } from 'vitest';
import { FILTROS_POR_DEFECTO } from './constantes';
import { useFiltrosStore } from './filtrosStore';
import type { FiltrosMapa } from './types';

const personalizados = (): FiltrosMapa => ({
  categorias: ['luz', 'arbol'],
  capas: { incidentes: true, zonasRiesgo: false, avisosOficiales: false },
  periodo: '24h',
});

describe('filtrosStore', () => {
  beforeEach(() => useFiltrosStore.getState().reiniciar());

  it('arranca con FILTROS_POR_DEFECTO', () => {
    expect(useFiltrosStore.getState().filtros).toEqual(FILTROS_POR_DEFECTO);
  });

  it('las categorías por defecto son "todas" (null): una categoría nueva del backend se ve sin tocar nada', () => {
    expect(FILTROS_POR_DEFECTO.categorias).toBeNull();
    expect(useFiltrosStore.getState().filtros.categorias).toBeNull();
  });

  it('reiniciar() vuelve a "todas" tras elegir un subconjunto', () => {
    useFiltrosStore.getState().aplicar(personalizados());
    useFiltrosStore.getState().reiniciar();
    expect(useFiltrosStore.getState().filtros.categorias).toBeNull();
  });

  it('el período por defecto es 7d (con datos reales "ahora" suele salir vacío)', () => {
    expect(FILTROS_POR_DEFECTO.periodo).toBe('7d');
    expect(useFiltrosStore.getState().filtros.periodo).toBe('7d');
  });

  it('aplicar() guarda los filtros', () => {
    useFiltrosStore.getState().aplicar(personalizados());
    expect(useFiltrosStore.getState().filtros).toEqual(personalizados());
  });

  it('reiniciar() deja exactamente FILTROS_POR_DEFECTO', () => {
    useFiltrosStore.getState().aplicar(personalizados());
    useFiltrosStore.getState().reiniciar();
    expect(useFiltrosStore.getState().filtros).toEqual(FILTROS_POR_DEFECTO);
  });

  it('no comparte referencias con FILTROS_POR_DEFECTO', () => {
    const { filtros } = useFiltrosStore.getState();
    expect(filtros).not.toBe(FILTROS_POR_DEFECTO);
    expect(filtros.capas).not.toBe(FILTROS_POR_DEFECTO.capas);
    const entrada = personalizados();
    useFiltrosStore.getState().aplicar(entrada);
    expect(useFiltrosStore.getState().filtros.categorias).not.toBe(entrada.categorias);
    useFiltrosStore.getState().reiniciar();
    const tras = useFiltrosStore.getState().filtros;
    expect(tras.capas).not.toBe(FILTROS_POR_DEFECTO.capas);
  });

  it('aplicar() copia: mutar el objeto original no altera el store', () => {
    const f = personalizados();
    useFiltrosStore.getState().aplicar(f);
    f.categorias?.push('luz');
    f.capas.incidentes = false;
    f.periodo = 'ahora';
    expect(useFiltrosStore.getState().filtros).toEqual(personalizados());
  });
});
