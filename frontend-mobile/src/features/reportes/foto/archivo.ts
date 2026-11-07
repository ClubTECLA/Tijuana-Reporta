import { Platform } from 'react-native';
import { File } from 'expo-file-system';

/**
 * La foto ya reducida como `Blob`, lista para pesarla o subirla. En nativo es un `File` de expo-file-system,
 * que lee del disco sin cargar la foto en memoria. En web esa API no existe (su `File` es un hueco vacío), así
 * que se pide el blob a la uri que devolvió el selector.
 */
export async function archivoDeFoto(uri: string): Promise<Blob> {
  if (Platform.OS === 'web') return (await fetch(uri)).blob();
  return new File(uri);
}
