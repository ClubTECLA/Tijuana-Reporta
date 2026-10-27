import { apiUrl } from '../types/global-variables'
import type {
    ApiCrearComentarioResponse,
    ApiCrearReporteRequest,
    ApiCrearReporteResponse,
    ApiListarReportesResponse,
    ApiEstadoReporte,
    ApiObtenerReporteResponse,
    ApiReporte,
} from '../types/api-types'
import { getAuthorizationHeader, getJsonHeaders, requestJson } from './http'

// El id va codificado: un valor con "/" o "?" no debe poder cambiar la ruta de la petición.
const reporteUrl = (reporteId: string) => `${apiUrl}/reportes/${encodeURIComponent(reporteId)}`

// GET /reportes (todos los no históricos, en cualquier estado)
export async function listarReportes(): Promise<ApiListarReportesResponse> {
    return requestJson(`${apiUrl}/reportes`, {
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
