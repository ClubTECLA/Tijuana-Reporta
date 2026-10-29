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
import { apiRequest } from '../lib/http'

// El id va codificado: un valor con "/" o "?" no debe poder cambiar la ruta de la petición.
const reportePath = (reporteId: string) => `/reportes/${encodeURIComponent(reporteId)}`

// GET /reportes (todos los no históricos, en cualquier estado)
export async function listarReportes(query?: ApiListarReportesQuery): Promise<ApiListarReportesResponse> {
    return apiRequest('/reportes', { query })
}

// GET /reportes/cercanos
export async function listarReportesCercanos(
    query: ApiListarReportesCercanosQuery,
): Promise<ApiListarReportesCercanosResponse> {
    return apiRequest('/reportes/cercanos', { query })
}

// GET /reportes/{reporteId}: detalle con comentarios, etiquetas, ubicaciones y multimedia
export async function obtenerReporte(reporteId: string): Promise<ApiObtenerReporteResponse> {
    return apiRequest(reportePath(reporteId))
}

// POST /reportes
export async function crearReporte(
    body: ApiCrearReporteRequest,
): Promise<ApiCrearReporteResponse> {
    return apiRequest('/reportes', { method: 'POST', json: body })
}

// PATCH /reportes/{reporteId}/estado (el backend solo lo permite a admin)
export async function cambiarEstadoReporte(
    reporteId: string,
    estado: ApiEstadoReporte,
): Promise<ApiReporte> {
    return apiRequest(`${reportePath(reporteId)}/estado`, { method: 'PATCH', json: { estado } })
}

// POST /reportes/{reporteId}/comentarios
export async function crearComentario(
    reporteId: string,
    comentario: string,
): Promise<ApiCrearComentarioResponse> {
    return apiRequest(`${reportePath(reporteId)}/comentarios`, { method: 'POST', json: { comentario } })
}

// PATCH /reportes/{reporteId}/avistamientos
export async function agregarAvistamiento(reporteId: string): Promise<ApiAgregarAvistamientoResponse> {
    return apiRequest(`${reportePath(reporteId)}/avistamientos`, { method: 'PATCH' })
}

// POST /reportes/{reporteId}/multimedia
export async function subirMultimedia(
    reporteId: string,
    file: File,
): Promise<ApiSubirMultimediaResponse> {
    const formData = new FormData()
    formData.append('file', file)

    return apiRequest(`${reportePath(reporteId)}/multimedia`, { method: 'POST', body: formData })
}
