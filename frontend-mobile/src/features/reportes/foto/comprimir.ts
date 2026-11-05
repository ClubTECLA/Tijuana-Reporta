/** El servidor acepta hasta 3 MiB; se deja margen para el multipart y las redes lentas. */
export const PESO_MAX_BYTES = 2 * 1024 * 1024;
export const CALIDAD_INICIAL = 0.75;
export const CALIDAD_MIN = 0.4;
const PASO_CALIDAD = 0.1;

/** La foto sigue pesando de más aunque se comprimió a la calidad mínima. */
export class FotoMuyPesadaError extends Error {
  constructor() {
    super('La foto es demasiado pesada.');
    this.name = 'FotoMuyPesadaError';
  }
}

// Evita arrastrar el error de coma flotante (0.75 - 0.1 - 0.1 no es exactamente 0.55).
const redondear = (calidad: number) => Math.round(calidad * 100) / 100;

/**
 * Comprime bajando la calidad poco a poco hasta que el archivo cabe en `pesoMaxBytes`; devuelve la
 * uri de la primera versión que cabe. `comprimir`, `pesoDe` y `descartar` se inyectan para no depender
 * de módulos nativos: así la regla se prueba sin dispositivo. `descartar` borra cada intento que pesa
 * de más, para no acumular JPEG en la caché; el que se devuelve nunca se borra.
 */
export async function comprimirHastaCaber(
  comprimir: (calidad: number) => Promise<string>,
  pesoDe: (uri: string) => Promise<number>,
  {
    pesoMaxBytes = PESO_MAX_BYTES,
    descartar,
  }: { pesoMaxBytes?: number; descartar?: (uri: string) => Promise<void> } = {},
): Promise<string> {
  let calidad = CALIDAD_INICIAL;
  for (;;) {
    const uri = await comprimir(calidad);
    if ((await pesoDe(uri)) <= pesoMaxBytes) return uri;
    await descartar?.(uri);
    if (calidad <= CALIDAD_MIN) throw new FotoMuyPesadaError();
    calidad = Math.max(CALIDAD_MIN, redondear(calidad - PASO_CALIDAD));
  }
}
