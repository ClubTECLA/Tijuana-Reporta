import { apiUrl } from '../types/global-variables'
import type {
    ApiCrearComentarioResponse,
    ApiCrearComentarioRequest,
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

// GET /reportes (active reports for the map)
export function listReports(query?: ApiListarReportesQuery): Promise<ApiListarReportesResponse> {
    return requestJson(`${apiUrl}/reportes${toQueryString(query ?? {})}`, {
        method: 'GET',
        headers: { Authorization: getAuthorizationHeader() },
    })
}

// GET /reportes/cercanos
export function listNearbyReports(
    query: ApiListarReportesCercanosQuery,
): Promise<ApiListarReportesCercanosResponse> {
    return requestJson(`${apiUrl}/reportes/cercanos${toQueryString(query)}`, {
        method: 'GET',
        headers: { Authorization: getAuthorizationHeader() },
    })
}

// GET /reportes/{reporteId}: detalle con comentarios, etiquetas, ubicaciones y multimedia
export function getReport(reportId: string): Promise<ApiObtenerReporteResponse> {
    return requestJson(`${apiUrl}/reportes/${reportId}`, {
        method: 'GET',
        headers: { Authorization: getAuthorizationHeader() },
    })
}

// POST /reportes
export function createReport(
    body: ApiCrearReporteRequest,
): Promise<ApiCrearReporteResponse> {
    return requestJson(`${apiUrl}/reportes`, {
        method: 'POST',
        headers: getJsonHeaders(),
        body: JSON.stringify(body),
    })
}

// PATCH /reportes/{reporteId}/estado (any authenticated role except citizens)
export function updateReportStatus(
    reportId: string,
    status: ApiEstadoReporte,
): Promise<ApiReporte> {
    return requestJson(`${apiUrl}/reportes/${reportId}/estado`, {
        method: 'PATCH',
        headers: getJsonHeaders(),
        body: JSON.stringify({ estado: status }),
    })
}

// PATCH /reportes/{reporteId}/avistamientos
export function addSighting(reportId: string): Promise<ApiAgregarAvistamientoResponse> {
    return requestJson(`${apiUrl}/reportes/${reportId}/avistamientos`, {
        method: 'PATCH',
        headers: { Authorization: getAuthorizationHeader() },
    })
}

// POST /reportes/{reporteId}/comentarios
export function createReportComment(
    reportId: string,
    comment: ApiCrearComentarioRequest['comentario'],
): Promise<ApiCrearComentarioResponse> {
    return requestJson(`${apiUrl}/reportes/${reportId}/comentarios`, {
        method: 'POST',
        headers: getJsonHeaders(),
        body: JSON.stringify({ comentario: comment }),
    })
}

// POST /reportes/{reporteId}/multimedia
export function uploadReportMedia(
    reportId: string,
    file: File,
): Promise<ApiSubirMultimediaResponse> {
    const formData = new FormData()
    formData.append('file', file)

    return requestJson(`${apiUrl}/reportes/${reportId}/multimedia`, {
        method: 'POST',
        headers: { Authorization: getAuthorizationHeader() },
        body: formData,
    })
}
