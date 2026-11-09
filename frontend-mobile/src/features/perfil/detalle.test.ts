import { describe, expect, it } from 'vitest';
import { pasosDeSeguimiento } from './detalle';

const hora = (iso: string) => `hora(${iso})`;
const paso = (estado: string) => pasosDeSeguimiento(estado, 'c', 'a', hora);

describe('pasosDeSeguimiento', () => {
  it('un reporte pendiente espera revisión', () => {
    const pasos = paso('Pendiente');
    expect(pasos.map((p) => p.estado)).toEqual(['completado', 'activo', 'pendiente']);
    expect(pasos[1].titulo).toBe('En espera de revisión');
  });

  it('probable y verificado están en revisión', () => {
    expect(paso('Probable')[1].titulo).toBe('En revisión por el equipo');
    expect(paso('Verificado')[1].titulo).toBe('En revisión por el equipo');
  });

  it('un reporte resuelto tiene todos los pasos completados', () => {
    expect(paso('Resuelto').map((p) => p.estado)).toEqual(['completado', 'completado', 'completado']);
  });

  it('un reporte descartado termina en dos pasos', () => {
    const pasos = paso('Descartado');
    expect(pasos).toHaveLength(2);
    expect(pasos[1].id).toBe('descartado');
  });

  it('usa la fecha de creación en el primer paso', () => {
    expect(paso('Pendiente')[0].hora).toBe('hora(c)');
  });
});