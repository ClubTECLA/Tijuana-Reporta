import { describe, expect, it } from 'vitest';
import { textoConfirmaciones } from './insignia';

describe('textoConfirmaciones', () => {
  it('muestra el número tal cual', () => {
    expect(textoConfirmaciones(2)).toBe('2');
    expect(textoConfirmaciones(37)).toBe('37');
    expect(textoConfirmaciones(99)).toBe('99');
  });

  it('desde 100 se abrevia a 99+ para no ensanchar el pin', () => {
    expect(textoConfirmaciones(100)).toBe('99+');
    expect(textoConfirmaciones(2500)).toBe('99+');
  });

  it('un valor inválido o negativo cuenta como 0', () => {
    expect(textoConfirmaciones(-3)).toBe('0');
    expect(textoConfirmaciones(Number.NaN)).toBe('0');
  });
});
