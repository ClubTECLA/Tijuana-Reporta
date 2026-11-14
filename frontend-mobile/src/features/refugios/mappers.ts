import { urlMultimedia } from '@/features/reportes/mappers';
import type { CentroApi, Refugio, TipoCentroApi } from './types';

// El seed del backend trae el tipo "Refugios" junto a Rescate, Salud y Seguridad. Se busca por nombre
// y no por id: el id lo asigna la base de datos y puede variar entre entornos.
const NOMBRE_TIPO_REFUGIO = 'refugios';

const normalizar = (texto: string) => texto.trim().toLowerCase();

/** Id del tipo "Refugios" en el catálogo, o `undefined` si el backend aún no lo tiene. */
export function idTipoRefugio(tipos: readonly TipoCentroApi[]): number | undefined {
  return tipos.find((t) => normalizar(t.nombre) === NOMBRE_TIPO_REFUGIO)?.id;
}

/** Centro del backend -> `Refugio`. `cantidad` es la gente que hay ahora; los espacios libres se derivan de ella. */
export function mapearCentro(c: CentroApi, apiUrl: string): Refugio {
  return {
    id: c.id,
    nombre: c.nombre,
    descripcion: c.descripcion?.trim() || null,
    imagenUrl: c.image_path ? urlMultimedia(c.image_path, apiUrl) : null,
    direccion: null,
    lat: c.latitude,
    lng: c.longitude,
    capacidad: c.capacidad,
    ocupados: c.cantidad,
  };
}

/** Solo los centros activos del tipo "Refugios". Sin ese tipo en el catálogo no hay refugios que mostrar. */
export function refugiosDeCentros(
  centros: readonly CentroApi[],
  tipos: readonly TipoCentroApi[],
  apiUrl: string,
): Refugio[] {
  const tipo = idTipoRefugio(tipos);
  if (tipo === undefined) return [];
  return centros.filter((c) => c.activo && c.tipo_centro === tipo).map((c) => mapearCentro(c, apiUrl));
}
