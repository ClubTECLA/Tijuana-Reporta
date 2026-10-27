import {
    apiUrl,
} from '../types/global-variables'
import type {
    ApiAgregarTagsRequest,
    ApiAgregarTagsResponse,
    ApiCrearIncidenteRequest,
    ApiCrearIncidenteResponse,
    ApiListarIncidentesQuery,
    ApiListarIncidentesResponse,
    ApiObtenerIncidenteResponse,
} from '../types/api-types'
import { getAuthorizationHeader, getJsonHeaders, requestJson } from './http'

// GET /incidentes
export async function listarIncidentes(
    query?: ApiListarIncidentesQuery,
): Promise<ApiListarIncidentesResponse> {
    const searchParams = new URLSearchParams()

    if (query?.incluir_inactivos !== undefined) {
        searchParams.set('incluir_inactivos', String(query.incluir_inactivos))
    }

    const queryString = searchParams.size > 0 ? `?${searchParams.toString()}` : ''

    return requestJson(`${apiUrl}/incidentes${queryString}`, {
        method: 'GET',
        headers: { Authorization: getAuthorizationHeader() },
    })
}

// POST /incidentes (administradores)
export async function crearIncidente(
    body: ApiCrearIncidenteRequest,
): Promise<ApiCrearIncidenteResponse> {
    return requestJson(`${apiUrl}/incidentes`, {
        method: 'POST',
        headers: getJsonHeaders(),
        body: JSON.stringify(body),
    })
}

// GET /incidentes/{incidenteId}
export async function obtenerIncidente(
    incidenteId: number,
): Promise<ApiObtenerIncidenteResponse> {
    return requestJson(`${apiUrl}/incidentes/${incidenteId}`, {
        method: 'GET',
        headers: { Authorization: getAuthorizationHeader() },
    })
}

// POST /incidentes/{incidenteId}/tags (administradores)
export async function agregarTags(
    incidenteId: number,
    tags: ApiAgregarTagsRequest,
): Promise<ApiAgregarTagsResponse> {
    return requestJson(`${apiUrl}/incidentes/${incidenteId}/tags`, {
        method: 'POST',
        headers: getJsonHeaders(),
        body: JSON.stringify(tags),
    })
}