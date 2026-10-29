import { describe, expect, it } from 'vitest';
import { LADO_MAX_PX, redimensionarA } from './dimensiones';

describe('redimensionarA', () => {
  it('no toca una foto cuyo lado largo ya cabe', () => {
    expect(redimensionarA(1200, 800)).toBeNull();
  });

  it('no toca una foto que mide justo el máximo', () => {
    expect(redimensionarA(LADO_MAX_PX, 900)).toBeNull();
  });

  it('acota el ancho en una foto horizontal', () => {
    expect(redimensionarA(4000, 3000)).toEqual({ width: LADO_MAX_PX });
  });

  it('acota el alto en una foto vertical', () => {
    expect(redimensionarA(3000, 4000)).toEqual({ height: LADO_MAX_PX });
  });

  it('acota el ancho en una foto cuadrada', () => {
    expect(redimensionarA(3000, 3000)).toEqual({ width: LADO_MAX_PX });
  });

  it('respeta un máximo distinto cuando se pide', () => {
    expect(redimensionarA(2000, 1000, 1000)).toEqual({ width: 1000 });
  });
});
