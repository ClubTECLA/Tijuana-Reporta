// GET /reportes/cercanos exige un punto y un radio. Mientras no haya filtro por viewport, la
// lista pide "toda Tijuana": centro fijo (el mismo de backend/cmd/http-tests/requests.http),
// radio y límite en el máximo del contrato (radio ≤ 50000 m, limite ≤ 500).
export const CENTRO_TIJUANA = { lat: 32.5149, lng: -117.0382 } as const;
export const RADIO_LISTA_M = 50000;
export const LIMITE_LISTA = 500;

/** Ruta de la lista. `desde` (ISO) filtra en servidor `created_at >= desde`; incidente_id y estado
 * no se mandan: esos filtros siguen en el cliente. */
export function rutaCercanos(desde?: string): string {
  const q = new URLSearchParams({
    lat: String(CENTRO_TIJUANA.lat),
    lng: String(CENTRO_TIJUANA.lng),
    radio: String(RADIO_LISTA_M),
    limite: String(LIMITE_LISTA),
  });
  if (desde !== undefined) q.set('desde', desde);
  return `/reportes/cercanos?${q.toString()}`;
}
