import { apiUrl } from '../types/global-variables'
import type {
    ApiCrearComentarioResponse,
    ApiCrearReporteRequest,
    ApiCrearReporteResponse,
    ApiListarReportesResponse,
} from '../types/api-types'
import { getAuthorizationHeader, getJsonHeaders, requestJson } from './http'

// GET /reportes (todos los no históricos, en cualquier estado)
export function listarReportes(): Promise<ApiListarReportesResponse> {
    return requestJson(`${apiUrl}/reportes`, {
        method: 'GET',
        headers: { Authorization: getAuthorizationHeader() },
    })
}

// POST /reportes
export function crearReporte(
    body: ApiCrearReporteRequest,
): Promise<ApiCrearReporteResponse> {
    return requestJson(`${apiUrl}/reportes`, {
        method: 'POST',
        headers: getJsonHeaders(),
        body: JSON.stringify(body),
    })
}

// POST /reportes/{reporteId}/comentarios
export function crearComentario(
    reporteId: string,
    comentario: string,
): Promise<ApiCrearComentarioResponse> {
    return requestJson(`${apiUrl}/reportes/${reporteId}/comentarios`, {
        method: 'POST',
        headers: getJsonHeaders(),
        body: JSON.stringify({ comentario }),
    })
}
