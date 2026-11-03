import { describe, expect, it } from 'vitest';
import { MAX_ALERTAS_DIA, registrarAlerta } from './limiteAlertas';

describe('registrarAlerta', () => {
  it('no repite el mismo incidente en el día', () => {
    const r = registrarAlerta(null, 'a', '2026-10-19');
    expect(r).toEqual({ dia: '2026-10-19', ids: ['a'] });
    expect(registrarAlerta(r, 'a', '2026-10-19')).toBeNull();
  });

  it('corta al llegar al tope diario y reinicia al cambiar el día', () => {
    const lleno = { dia: '2026-10-19', ids: Array.from({ length: MAX_ALERTAS_DIA }, (_, i) => `id${i}`) };
    expect(registrarAlerta(lleno, 'nuevo', '2026-10-19')).toBeNull();
    expect(registrarAlerta(lleno, 'id0', '2026-10-20')).toEqual({ dia: '2026-10-20', ids: ['id0'] });
  });
});
