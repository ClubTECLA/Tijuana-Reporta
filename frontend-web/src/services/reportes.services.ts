import { apiUrl } from '../types/global-variables'
import type {
    ApiCrearComentarioResponse,
    ApiCrearReporteRequest,
    ApiCrearReporteResponse,
    ApiListarReportesResponse,
    ApiEstadoReporte,
    ApiMultimedia,
    ApiObtenerReporteResponse,
    ApiReporte,
} from '../types/api-types'
import { getAuthorizationHeader, getJsonHeaders, requestJson } from './http'

// El id va codificado: un valor con "/" o "?" no debe poder cambiar la ruta de la petición.
const reporteUrl = (reporteId: string) => `${apiUrl}/reportes/${encodeURIComponent(reporteId)}`

// Una foto de 3 MiB en una conexión lenta tarda más que el límite general de http.ts.
const UPLOAD_TIMEOUT_MS = 60_000

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

// POST /reportes. Con es_oficial: true, el backend responde 403 si quien lo crea es ciudadano.
export async function crearReporte(
    body: ApiCrearReporteRequest,
): Promise<ApiCrearReporteResponse> {
    return requestJson(`${apiUrl}/reportes`, {
        method: 'POST',
        headers: getJsonHeaders(),
        body: JSON.stringify(body),
    })
}

// PATCH /reportes/{reporteId}/estado (cualquier rol menos ciudadano)
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

// POST /reportes/{reporteId}/multimedia: la foto del creador del reporte (una por usuario, JPEG ya reducido).
// Sin Content-Type: el navegador lo pone con el boundary del multipart.
export async function subirFotoReporte(reporteId: string, foto: Blob): Promise<ApiMultimedia> {
    const body = new FormData()
    body.append('file', foto, 'foto.jpg')
    return requestJson(`${reporteUrl(reporteId)}/multimedia`, {
        method: 'POST',
        headers: { Authorization: getAuthorizationHeader() },
        body,
        signal: AbortSignal.timeout(UPLOAD_TIMEOUT_MS),
    })
}

/** URL pública de una foto guardada (nginx la sirve fuera de /api). */
export function fotoUrl(path: string) {
    return `/multimedia/${path.split('/').map(encodeURIComponent).join('/')}`
}
