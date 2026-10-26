/** Caché del GET /reportes/{id} crudo, compartida por detalle y comentarios (ver `http.ts`). */
export const detalleApiKey = (id: string) => ['reportes', 'detalle-api', id] as const;
