import { apiUrl } from '../types/global-variables'
import type {
    ApiCrearComentarioResponse,
    ApiCrearReporteRequest,
    ApiCrearReporteResponse,
    ApiListarReportesResponse,
    ApiListarReportesQuery,
    ApiListarReportesCercanosQuery,
    ApiListarReportesCercanosResponse,
    ApiAgregarAvistamientoResponse,
    ApiEstadoReporte,
    ApiObtenerReporteResponse,
    ApiReporte,
    ApiSubirMultimediaResponse,
} from '../types/api-types'
import { getAuthorizationHeader, getJsonHeaders, requestJson } from './http'

function toQueryString(query: object): string {
    const searchParams = new URLSearchParams()

    for (const [key, value] of Object.entries(query)) {
        if (value === undefined) continue

        if (Array.isArray(value)) {
            for (const item of value) searchParams.append(key, String(item))
        } else {
            searchParams.set(key, String(value))
        }
    }

    return searchParams.size > 0 ? `?${searchParams.toString()}` : ''
}

// El id va codificado: un valor con "/" o "?" no debe poder cambiar la ruta de la petición.
const reporteUrl = (reporteId: string) => `${apiUrl}/reportes/${encodeURIComponent(reporteId)}`

// GET /reportes (todos los no históricos, en cualquier estado)
export async function listarReportes(query?: ApiListarReportesQuery): Promise<ApiListarReportesResponse> {
    return requestJson(`${apiUrl}/reportes${toQueryString(query ?? {})}`, {
        method: 'GET',
        headers: { Authorization: getAuthorizationHeader() },
    })
}

// GET /reportes/cercanos
export async function listarReportesCercanos(
    query: ApiListarReportesCercanosQuery,
): Promise<ApiListarReportesCercanosResponse> {
    return requestJson(`${apiUrl}/reportes/cercanos${toQueryString(query)}`, {
        method: 'GET',
        headers: { Authorization: getAuthorizationHeader() },
    })
}

// GET /reportes/{reporteId}: detalle con comentarios, etiquetas, ubicaciones y multimedia
export async function obtenerReporte(reporteId: string): Promise<ApiObtenerReporteResponse> {
    return requestJson(reporteUrl(reporteId), {
        method: 'GET',
        headers: { Authorization: getAuthorizationHeader() },
    })
}

// POST /reportes
export async function crearReporte(
    body: ApiCrearReporteRequest,
): Promise<ApiCrearReporteResponse> {
    return requestJson(`${apiUrl}/reportes`, {
        method: 'POST',
        headers: getJsonHeaders(),
        body: JSON.stringify(body),
    })
}

// PATCH /reportes/{reporteId}/estado (el backend solo lo permite a admin)
export async function cambiarEstadoReporte(
    reporteId: string,
    estado: ApiEstadoReporte,
): Promise<ApiReporte> {
    return requestJson(`${reporteUrl(reporteId)}/estado`, {
        method: 'PATCH',
        headers: getJsonHeaders(),
        body: JSON.stringify({ estado }),
    })
}

// POST /reportes/{reporteId}/comentarios
export async function crearComentario(
    reporteId: string,
    comentario: string,
): Promise<ApiCrearComentarioResponse> {
    return requestJson(`${reporteUrl(reporteId)}/comentarios`, {
        method: 'POST',
        headers: getJsonHeaders(),
        body: JSON.stringify({ comentario }),
    })
}

// PATCH /reportes/{reporteId}/avistamientos
export async function agregarAvistamiento(reporteId: string): Promise<ApiAgregarAvistamientoResponse> {
    return requestJson(`${reporteUrl(reporteId)}/avistamientos`, {
        method: 'PATCH',
        headers: { Authorization: getAuthorizationHeader() },
    })
}

// POST /reportes/{reporteId}/multimedia
export async function subirMultimedia(
    reporteId: string,
    file: File,
): Promise<ApiSubirMultimediaResponse> {
    const formData = new FormData()
    formData.append('file', file)

    return requestJson(`${reporteUrl(reporteId)}/multimedia`, {
        method: 'POST',
        headers: { Authorization: getAuthorizationHeader() },
        body: formData,
    })
}
