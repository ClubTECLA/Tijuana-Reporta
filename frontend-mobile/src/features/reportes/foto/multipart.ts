/** Cuerpo de `POST /reportes/{id}/multimedia`: la foto va en el campo `file`.
 *
 * `foto` debe ser un `Blob` de verdad: en la app, un `File` de `expo-file-system`. El `fetch` de Expo
 * rechaza el objeto `{ uri, name, type }` propio de React Native ("Unsupported FormDataPart implementation"). */
export function formularioFoto(foto: Blob): FormData {
  const formulario = new FormData();
  formulario.append('file', foto, 'foto.jpg');
  return formulario;
}
