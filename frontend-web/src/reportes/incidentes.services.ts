import type {
    ApiAgregarTagsRequest,
    ApiAgregarTagsResponse,
    ApiCrearIncidenteRequest,
    ApiCrearIncidenteResponse,
    ApiListarIncidentesQuery,
    ApiListarIncidentesResponse,
    ApiObtenerIncidenteResponse,
} from '../types/api-types'
import { apiRequest } from '../lib/http'

// GET /incidentes
export async function listarIncidentes(
    query?: ApiListarIncidentesQuery,
): Promise<ApiListarIncidentesResponse> {
    return apiRequest('/incidentes', { query })
}

// POST /incidentes (administradores)
export async function crearIncidente(
    body: ApiCrearIncidenteRequest,
): Promise<ApiCrearIncidenteResponse> {
    return apiRequest('/incidentes', { method: 'POST', json: body })
}

// GET /incidentes/{incidenteId}
export async function obtenerIncidente(
    incidenteId: number,
): Promise<ApiObtenerIncidenteResponse> {
    return apiRequest(`/incidentes/${incidenteId}`)
}

// POST /incidentes/{incidenteId}/tags (administradores)
export async function agregarTags(
    incidenteId: number,
    tags: ApiAgregarTagsRequest,
): Promise<ApiAgregarTagsResponse> {
    return apiRequest(`/incidentes/${incidenteId}/tags`, { method: 'POST', json: tags })
}
