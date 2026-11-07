import { describe, expect, it } from 'vitest';
import { mapearEstadoMio, separarMisReportes } from './misReportes';

describe('mapearEstadoMio', () => {
  it('traduce los cinco estados del backend', () => {
    expect(mapearEstadoMio('Pendiente')).toBe('pendiente');
    expect(mapearEstadoMio('Probable')).toBe('en_revision');
    expect(mapearEstadoMio('Verificado')).toBe('en_revision');
    expect(mapearEstadoMio('Resuelto')).toBe('resuelto');
    expect(mapearEstadoMio('Descartado')).toBe('descartado');
  });

  it('trata un estado desconocido como pendiente', () => {
    expect(mapearEstadoMio('Otro')).toBe('pendiente');
  });
});

describe('separarMisReportes', () => {
  const base = { titulo: 'Bache', direccion: 'Calle 1' };

  it('manda los estados finales a cerrados y el resto a activos', () => {
    const { activos, cerrados } = separarMisReportes([
      { ...base, id: '1', estado_actual: 'Pendiente' },
      { ...base, id: '2', estado_actual: 'Verificado' },
      { ...base, id: '3', estado_actual: 'Resuelto' },
      { ...base, id: '4', estado_actual: 'Descartado' },
    ]);
    expect(activos.map((r) => r.id)).toEqual(['1', '2']);
    expect(cerrados.map((r) => r.id)).toEqual(['3', '4']);
  });

  it('usa un texto de respaldo cuando no hay dirección', () => {
    const { activos } = separarMisReportes([{ id: '1', titulo: 'Bache', estado_actual: 'Pendiente' }]);
    expect(activos[0].meta).toBe('Sin dirección');
  });
});