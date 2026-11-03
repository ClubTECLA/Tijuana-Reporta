import { describe, expect, it } from 'vitest';
import { esCorreoValido } from './correo';

describe('esCorreoValido', () => {
  it('acepta correos normales, con espacios alrededor', () => {
    expect(esCorreoValido('alex@uabc.edu.mx')).toBe(true);
    expect(esCorreoValido('  alex.r+tj@gmail.com ')).toBe(true);
  });

  it('rechaza lo que no es correo', () => {
    for (const c of ['', 'alex', 'alex@', 'alex@uabc', '@uabc.mx', 'alex @uabc.mx', '664-123-4567']) {
      expect(esCorreoValido(c)).toBe(false);
    }
  });
});
