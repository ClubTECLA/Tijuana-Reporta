// GET /reportes/cercanos exige un punto y un radio. Mientras no haya filtro por viewport, la
// lista pide "toda Tijuana": centro fijo (el mismo de backend/cmd/http-tests/requests.http),
// radio y límite en el máximo del contrato (radio ≤ 50000 m, limite ≤ 500).
export const CENTRO_TIJUANA = { lat: 32.5149, lng: -117.0382 } as const;
export const RADIO_LISTA_M = 50000;
export const LIMITE_LISTA = 500;

/** Zona de la consulta; lo que falte se completa con "toda Tijuana". */
export interface ZonaCercanos {
  centro?: { lat: number; lng: number };
  radioM?: number;
}

/** Ruta de la lista. `desde` (ISO) filtra en servidor `created_at >= desde`; incidente_id y estado
 * no se mandan: esos filtros siguen en el cliente. `zona` acota el centro y el radio (p. ej. la
 * búsqueda de duplicados, que solo necesita lo que hay junto al punto del reporte). */
export function rutaCercanos(desde?: string, zona: ZonaCercanos = {}): string {
  const centro = zona.centro ?? CENTRO_TIJUANA;
  const q = new URLSearchParams({
    lat: String(centro.lat),
    lng: String(centro.lng),
    radio: String(zona.radioM ?? RADIO_LISTA_M),
    limite: String(LIMITE_LISTA),
  });
  if (desde !== undefined) q.set('desde', desde);
  return `/reportes/cercanos?${q.toString()}`;
}
