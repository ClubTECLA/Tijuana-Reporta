import { afterEach, describe, expect, it, vi } from 'vitest';

const plataforma = vi.hoisted(() => ({ OS: 'android' }));

vi.mock('react-native', () => ({ Platform: plataforma }));
// Stand-in del `File` de expo-file-system: solo recuerda la uri con la que se construyó.
vi.mock('expo-file-system', () => ({
  File: class {
    constructor(public uri: string) {}
  },
}));

import { archivoDeFoto } from './archivo';

describe('archivoDeFoto', () => {
  afterEach(() => {
    plataforma.OS = 'android';
    vi.unstubAllGlobals();
  });

  it('en nativo usa el File de expo-file-system sobre la uri', async () => {
    const archivo = await archivoDeFoto('file:///cache/foto.jpg');

    expect((archivo as unknown as { uri: string }).uri).toBe('file:///cache/foto.jpg');
  });

  it('en web devuelve el Blob de la uri y no construye un File nativo', async () => {
    plataforma.OS = 'web';
    const blob = new Blob(['jpeg'], { type: 'image/jpeg' });
    const pedir = vi.fn(async (_uri: string) => ({ blob: async () => blob }));
    vi.stubGlobal('fetch', pedir);

    const archivo = await archivoDeFoto('blob:http://localhost:8081/abc');

    expect(archivo).toBe(blob);
    expect(pedir).toHaveBeenCalledWith('blob:http://localhost:8081/abc');
  });
});
