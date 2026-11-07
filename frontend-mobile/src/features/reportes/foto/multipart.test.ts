import { describe, expect, it } from 'vitest';
import { formularioFoto } from './multipart';

// El `fetch` de Expo solo acepta partes que sean `Blob` (en la app, un `File` de expo-file-system): el
// objeto `{ uri, name, type }` de React Native se rechaza con "Unsupported FormDataPart implementation".
const foto = () => new Blob(['contenido-jpeg'], { type: 'image/jpeg' });

describe('formularioFoto', () => {
  it('manda la foto en el campo "file" que exige el backend', () => {
    expect(formularioFoto(foto()).has('file')).toBe(true);
  });

  it('no agrega otros campos', () => {
    expect([...formularioFoto(foto()).keys()]).toEqual(['file']);
  });

  it('la parte es un archivo de verdad (Blob), no un objeto { uri, name, type }', () => {
    expect(formularioFoto(foto()).get('file')).toBeInstanceOf(Blob);
  });

  it('nombra el archivo foto.jpg', () => {
    expect((formularioFoto(foto()).get('file') as File).name).toBe('foto.jpg');
  });

  it('conserva el contenido de la foto', async () => {
    const parte = formularioFoto(foto()).get('file') as Blob;

    expect(await parte.text()).toBe('contenido-jpeg');
  });
});
