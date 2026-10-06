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

const accessTokenKey = 'access_token'

function getAuthorizationHeader(): string {
    const accessToken = localStorage.getItem(accessTokenKey)

    if (!accessToken) {
        throw new Error('Se requiere iniciar sesión para consultar los incidentes.')
    }

    return `Bearer ${accessToken}`
}

async function throwApiError(response: Response): Promise<never> {
    const responseBody = await response.text()
    let message = response.statusText || 'No se pudo completar la solicitud.'

    if (responseBody) {
        try {
            const errorData: unknown = JSON.parse(responseBody)
            if (
                typeof errorData === 'object'
                && errorData !== null
                && 'message' in errorData
                && typeof errorData.message === 'string'
            ) {
                message = errorData.message
            } else {
                message = responseBody
            }
        } catch {
            message = responseBody
        }
    }

    throw Object.assign(new Error(message), { status: response.status })
}

async function requestJson<T>(url: string, init: RequestInit): Promise<T> {
    const response = await fetch(url, init)

    if (!response.ok) {
        return throwApiError(response)
    }

    return response.json() as Promise<T>
}

function getJsonHeaders(): HeadersInit {
    return {
        Authorization: getAuthorizationHeader(),
        'Content-Type': 'application/json',
    }
}

// GET /incidentes
export function listarIncidentes(
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
export function crearIncidente(
    body: ApiCrearIncidenteRequest,
): Promise<ApiCrearIncidenteResponse> {
    return requestJson(`${apiUrl}/incidentes`, {
        method: 'POST',
        headers: getJsonHeaders(),
        body: JSON.stringify(body),
    })
}

// GET /incidentes/{incidenteId}
export function obtenerIncidente(
    incidenteId: number,
): Promise<ApiObtenerIncidenteResponse> {
    return requestJson(`${apiUrl}/incidentes/${incidenteId}`, {
        method: 'GET',
        headers: { Authorization: getAuthorizationHeader() },
    })
}

// POST /incidentes/{incidenteId}/tags (administradores)
export function agregarTags(
    incidenteId: number,
    tags: ApiAgregarTagsRequest,
): Promise<ApiAgregarTagsResponse> {
    return requestJson(`${apiUrl}/incidentes/${incidenteId}/tags`, {
        method: 'POST',
        headers: getJsonHeaders(),
        body: JSON.stringify(tags),
    })
}