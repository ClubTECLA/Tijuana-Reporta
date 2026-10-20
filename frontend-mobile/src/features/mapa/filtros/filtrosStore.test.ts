import { beforeEach, describe, expect, it } from 'vitest';
import { FILTROS_POR_DEFECTO } from './constantes';
import { useFiltrosStore } from './filtrosStore';
import type { FiltrosMapa } from './types';

const personalizados = (): FiltrosMapa => ({
  categorias: ['luz', 'arbol'],
  capas: { incidentes: true, zonasRiesgo: false, avisosOficiales: false },
  periodo: '7d',
});

describe('filtrosStore', () => {
  beforeEach(() => useFiltrosStore.getState().reiniciar());

  it('arranca con FILTROS_POR_DEFECTO', () => {
    expect(useFiltrosStore.getState().filtros).toEqual(FILTROS_POR_DEFECTO);
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
    expect(filtros.categorias).not.toBe(FILTROS_POR_DEFECTO.categorias);
    expect(filtros.capas).not.toBe(FILTROS_POR_DEFECTO.capas);
    useFiltrosStore.getState().aplicar(personalizados());
    useFiltrosStore.getState().reiniciar();
    const tras = useFiltrosStore.getState().filtros;
    expect(tras.categorias).not.toBe(FILTROS_POR_DEFECTO.categorias);
    expect(tras.capas).not.toBe(FILTROS_POR_DEFECTO.capas);
  });

  it('aplicar() copia: mutar el objeto original no altera el store', () => {
    const f = personalizados();
    useFiltrosStore.getState().aplicar(f);
    f.categorias.push('luz');
    f.capas.incidentes = false;
    f.periodo = 'ahora';
    expect(useFiltrosStore.getState().filtros).toEqual(personalizados());
  });
});
