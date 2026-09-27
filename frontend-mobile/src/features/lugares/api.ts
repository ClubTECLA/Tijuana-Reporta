import { lugaresNominatim } from './nominatim';
import type { LugaresApi } from './port';

// La búsqueda de lugares no depende del contrato propio (mocks/http de
// `env.useMocks`): siempre geocodifica contra Nominatim/OSM, en vivo.
export const lugaresApi: LugaresApi = lugaresNominatim;
