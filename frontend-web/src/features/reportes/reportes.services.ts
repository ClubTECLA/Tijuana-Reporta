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
} from '@/types/api-types'
import { apiRequest } from '@/lib/http'

// El id va codificado: un valor con "/" o "?" no debe poder cambiar la ruta de la petición.
const reportePath = (reporteId: string) => `/reportes/${encodeURIComponent(reporteId)}`

// Una foto de 3 MiB en una conexión lenta tarda más que el límite general de lib/http.
const UPLOAD_TIMEOUT_MS = 60_000

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

// POST /reportes. Con es_oficial: true, el backend responde 403 si quien lo crea es ciudadano.
export async function crearReporte(
    body: ApiCrearReporteRequest,
): Promise<ApiCrearReporteResponse> {
    return apiRequest('/reportes', { method: 'POST', json: body })
}

// PATCH /reportes/{reporteId}/estado (cualquier rol menos ciudadano)
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

// POST /reportes/{reporteId}/multimedia: la foto del creador del reporte (una por usuario, JPEG ya reducido con prepararFoto).
export async function subirMultimedia(
    reporteId: string,
    file: Blob,
): Promise<ApiSubirMultimediaResponse> {
    const formData = new FormData()
    formData.append('file', file, 'foto.jpg')

    return apiRequest(`${reportePath(reporteId)}/multimedia`, {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(UPLOAD_TIMEOUT_MS),
    })
}
