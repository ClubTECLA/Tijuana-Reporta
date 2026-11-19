import type {
    ApiMapaCalor,
    ApiObtenerMapaCalorQuery,
    ApiObtenerResumenRiesgoQuery,
    ApiResumenRiesgo,
} from '@/types/api-types'
import { apiRequest } from '@/lib/http'

// Mismo límite que lib/http: un signal propio (para cancelar al mover el mapa) reemplaza el suyo, así que se combinan.
const REQUEST_TIMEOUT_MS = 15_000

// Sin signal no se pasa la opción: un `signal: undefined` también quitaría el tiempo límite de apiRequest.
const signalOption = (signal?: AbortSignal) =>
    signal ? { signal: AbortSignal.any([signal, AbortSignal.timeout(REQUEST_TIMEOUT_MS)]) } : {}

// GET /riesgo/mapa-calor: peso de los reportes históricos del área visible, en celdas según el zoom.
export async function obtenerMapaCalor(query: ApiObtenerMapaCalorQuery, signal?: AbortSignal): Promise<ApiMapaCalor> {
    return apiRequest('/riesgo/mapa-calor', { query, ...signalOption(signal) })
}

// GET /riesgo/resumen: zonas, colonias y conteo por categoría de toda la ciudad.
export async function obtenerResumenRiesgo(query?: ApiObtenerResumenRiesgoQuery, signal?: AbortSignal): Promise<ApiResumenRiesgo> {
    return apiRequest('/riesgo/resumen', { query, ...signalOption(signal) })
}
