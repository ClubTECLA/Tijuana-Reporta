import { USER_AGENT } from '@/features/lugares/nominatim';
import { fetchConRed } from '@/lib/http';

// Geocodificación inversa de Nominatim: el backend de centros no guarda dirección y el Figma la muestra
// bajo el nombre del refugio. Misma política de uso que la búsqueda (~1 req/s, User-Agent propio); aquí
// solo se pide al abrir la tarjeta de un refugio, y la respuesta se cachea para siempre.
const NOMINATIM_REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse';

interface RespuestaReverse {
  address?: {
    road?: string;
    house_number?: string;
    suburb?: string;
    neighbourhood?: string;
    postcode?: string;
    city_district?: string;
    city?: string;
  };
}

/** "Segunda Sur 701, Del Rio, 22416 Otay Centenario": calle y número, colonia, y código postal con su zona. */
export function formatearDireccion(respuesta: RespuestaReverse): string | null {
  const a = respuesta.address;
  if (!a) return null;
  const calle = [a.road, a.house_number].filter(Boolean).join(' ');
  const zona = [a.postcode, a.city_district ?? a.city].filter(Boolean).join(' ');
  return [calle, a.suburb ?? a.neighbourhood, zona].filter(Boolean).join(', ') || null;
}

/** Dirección de unas coordenadas, o `null` si Nominatim no tiene una para ese punto. */
export async function direccionDeCoordenadas(lat: number, lng: number): Promise<string | null> {
  const params = new URLSearchParams({
    format: 'jsonv2',
    lat: String(lat),
    lon: String(lng),
    zoom: '18',
    addressdetails: '1',
    'accept-language': 'es',
  });
  const response = await fetchConRed(`${NOMINATIM_REVERSE_URL}?${params.toString()}`, {
    headers: { 'User-Agent': USER_AGENT },
  });
  if (!response.ok) throw new Error(`Nominatim respondió ${response.status}`);
  return formatearDireccion((await response.json()) as RespuestaReverse);
}
