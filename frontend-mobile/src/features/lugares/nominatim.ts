import { reportesApi } from '@/features/reportes/api';
import { distanciaMetros } from '@/lib/geo';
import type { LugarResultado, TonoLugar } from './types';
import type { LugaresApi } from './port';

// Geocodificación de Nominatim (OpenStreetMap): gratuita, sin API key, pensada
// para encajar con el basemap CARTO/OSM que ya usa el mapa. Política de uso
// (https://operations.osmfoundation.org/policies/nominatim/): máx. ~1 req/s
// y exige identificar la app; por eso el User-Agent y el debounce en el
// llamador (ver app/(main)/buscar.tsx). En producción real conviene pasar por
// un proxy propio o un proveedor con SLA — esto es válido para desarrollo/demo.
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
// Debe ser puro ASCII: OkHttp (Android) rechaza headers con tildes/eñes con
// un IllegalArgumentException que revienta el fetch antes de salir a la red.
const USER_AGENT = 'TijuanaReporta/1.0 (mobile app; contact: equipo-el-nino)';

// Bounding box que cubre Tijuana y sus delegaciones (La Presa, Otay, Playas…)
// para sesgar resultados sin descartar direcciones fuera de la ciudad.
const TIJUANA_VIEWBOX = '-117.15,32.60,-116.85,32.40';

// Umbral para "cerca" de un resultado de búsqueda, y cortes de severidad que
// replican el Figma: 0 activos → neutro, 1 → advertencia, 2+ → peligro.
const RADIO_ACTIVOS_M = 1200;

interface NominatimAddress {
  road?: string;
  suburb?: string;
  neighbourhood?: string;
  city_district?: string;
  city?: string;
  town?: string;
  village?: string;
  state?: string;
}

interface NominatimResult {
  place_id: number;
  lat: string;
  lon: string;
  name?: string;
  display_name: string;
  address?: NominatimAddress;
}

/** Obtiene el nombre del lugar y un subtítulo de dirección evitando repetir el nombre. */
function nombreYSubtitulo(r: NominatimResult): { nombre: string; subtitulo: string } {
  const addr = r.address ?? {};
  // El nombre propio del lugar (el que Nominatim ya decidió que es el mejor
  // match para la búsqueda) va primero. Si solo usáramos addr.suburb/road,
  // lugares distintos dentro de la misma colonia o calle se verían idénticos
  // (p. ej. "Playas de Tijuana" la colonia vs. "Palma Real Playas de
  // Tijuana" un fraccionamiento adentro de ella, ambos con addr.suburb igual).
  const nombre = r.name ?? addr.road ?? addr.suburb ?? addr.neighbourhood ?? r.display_name.split(',')[0].trim();
  const localidad = addr.city ?? addr.town ?? addr.village ?? addr.city_district;
  const subtitulo =
    [
      addr.suburb && addr.suburb !== nombre ? addr.suburb : undefined,
      addr.road && addr.road !== nombre ? addr.road : undefined,
      localidad,
    ]
      .filter(Boolean)
      .slice(0, 2)
      .join(', ') || r.display_name.split(',').slice(1, 3).join(',').trim();
  return { nombre, subtitulo };
}

/** Asigna tono neutro a cero incidentes, advertencia a uno y peligro a dos o más. */
function tonoPorActivos(activos: number): TonoLugar {
  if (activos >= 2) return 'peligro';
  if (activos === 1) return 'advertencia';
  return 'neutro';
}

export const lugaresNominatim: LugaresApi = {
  /** Busca en Nominatim dentro del área de Tijuana, añade incidentes activos cercanos y elimina resultados visualmente repetidos. */
  async buscar(query) {
    const q = query.trim();
    if (q.length < 3) return [];

    const params = new URLSearchParams({
      format: 'jsonv2',
      q,
      countrycodes: 'mx',
      viewbox: TIJUANA_VIEWBOX,
      bounded: '1',
      addressdetails: '1',
      limit: '6',
      'accept-language': 'es',
    });

    const response = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
      headers: { 'User-Agent': USER_AGENT },
    });
    if (!response.ok) throw new Error(`Nominatim respondió ${response.status}`);
    const resultados = (await response.json()) as NominatimResult[];

    const reportes = await reportesApi.listar().catch(() => []);

    const lugares = resultados.map((r): LugarResultado => {
      const lat = parseFloat(r.lat);
      const lng = parseFloat(r.lon);
      const { nombre, subtitulo } = nombreYSubtitulo(r);
      const activos = reportes.filter(
        (rep) => rep.status !== 'resuelto' && distanciaMetros({ lat, lng }, rep) <= RADIO_ACTIVOS_M,
      ).length;
      return {
        id: String(r.place_id),
        nombre,
        subtitulo,
        lat,
        lng,
        activos,
        tono: tonoPorActivos(activos),
      };
    });

    // Nominatim ya viene ordenado por relevancia: si dos resultados distintos
    // igual se ven idénticos en pantalla (mismo nombre + subtítulo), solo se
    // muestra el más relevante para no confundir con "clones".
    const vistos = new Set<string>();
    return lugares.filter((l) => {
      const clave = `${l.nombre}|${l.subtitulo}`;
      if (vistos.has(clave)) return false;
      vistos.add(clave);
      return true;
    });
  },
};
