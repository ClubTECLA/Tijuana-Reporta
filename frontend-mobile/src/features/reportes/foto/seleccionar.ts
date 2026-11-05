import { Platform } from 'react-native';
import { File } from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { comprimirHastaCaber } from './comprimir';
import { redimensionarA } from './dimensiones';
import { mensajePrepararFoto } from './errores';

// Adaptador delgado sobre módulos nativos: no se prueba en node. Las reglas (tamaño, calidad, mensajes)
// viven en `dimensiones`, `comprimir` y `errores`, que sí tienen pruebas.

export type OrigenFoto = 'camara' | 'galeria';

export type ResultadoSeleccionFoto =
  | { tipo: 'ok'; uri: string }
  | { tipo: 'cancelado' }
  | { tipo: 'sin_permiso' }
  | { tipo: 'error'; mensaje: string };

/** Peso del archivo en bytes. En nativo se lee del sistema de archivos sin cargar la foto en memoria; en
 * web no existe la API de archivos de Expo, así que se mide el blob de la uri. */
async function pesoDeArchivo(uri: string): Promise<number> {
  if (Platform.OS === 'web') return (await (await fetch(uri)).blob()).size;
  return new File(uri).size;
}

/** Borra un intento de compresión que no cupo. En web la uri es un blob en memoria: no hay archivo que borrar. */
async function descartarArchivo(uri: string): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    new File(uri).delete();
  } catch {
    // Ya no existe: no hay nada que limpiar.
  }
}

/** Reduce la foto a JPEG de lado largo acotado y menos de 2 MB, como pide el servidor. Re-codificar también
 * convierte HEIC/PNG a JPEG y deja la orientación aplicada (el servidor descarta el EXIF). */
async function reducirFoto(foto: { uri: string; width: number; height: number }): Promise<string> {
  const tamano = redimensionarA(foto.width, foto.height);
  const acciones = tamano ? [{ resize: tamano }] : [];
  const comprimir = async (calidad: number) =>
    (
      await ImageManipulator.manipulateAsync(foto.uri, acciones, {
        compress: calidad,
        format: ImageManipulator.SaveFormat.JPEG,
      })
    ).uri;
  return comprimirHastaCaber(comprimir, pesoDeArchivo, { descartar: descartarArchivo });
}

/** Abre la cámara o la galería y devuelve la uri de una foto ya lista para subir. La galería no pide
 * permiso (selector del sistema); la cámara sí. */
export async function elegirFoto(origen: OrigenFoto): Promise<ResultadoSeleccionFoto> {
  try {
    if (origen === 'camara') {
      const permiso = await ImagePicker.requestCameraPermissionsAsync();
      if (!permiso.granted) return { tipo: 'sin_permiso' };
    }
    // `quality: 1`: aquí no se comprime; de eso se encarga `reducirFoto` una sola vez.
    const opciones = { mediaTypes: ['images' as const], quality: 1, exif: false };
    const resultado =
      origen === 'camara'
        ? await ImagePicker.launchCameraAsync(opciones)
        : await ImagePicker.launchImageLibraryAsync(opciones);
    if (resultado.canceled) return { tipo: 'cancelado' };
    return { tipo: 'ok', uri: await reducirFoto(resultado.assets[0]) };
  } catch (error) {
    return { tipo: 'error', mensaje: mensajePrepararFoto(error) };
  }
}
