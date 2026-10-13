/** Código corto legible para mostrar ("REP-8836"), derivado del id. Solo presentación: no es un identificador. */
export function codigoReporte(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) % 9000;
  return `REP-${hash + 1000}`;
}
