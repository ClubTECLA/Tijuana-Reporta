import { describe, expect, it } from 'vitest';
import { periodoADesde } from './periodoADesde';

const AHORA = new Date('2026-10-22T12:00:00.000Z');

describe('periodoADesde', () => {
  it('"ahora" resta 2 h al reloj inyectado', () => {
    expect(periodoADesde('ahora', AHORA)).toBe('2026-10-22T10:00:00.000Z');
  });

  it('"24h" resta un día', () => {
    expect(periodoADesde('24h', AHORA)).toBe('2026-10-21T12:00:00.000Z');
  });

  it('"7d" resta una semana', () => {
    expect(periodoADesde('7d', AHORA)).toBe('2026-10-15T12:00:00.000Z');
  });

  it('sin período no hay límite inferior', () => {
    expect(periodoADesde(undefined, AHORA)).toBeUndefined();
  });

  it('no muta el reloj recibido', () => {
    periodoADesde('7d', AHORA);
    expect(AHORA.toISOString()).toBe('2026-10-22T12:00:00.000Z');
  });
});
