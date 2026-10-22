// Helpers compartidos por los servicios que llaman a la API (token, JSON y errores).

const accessTokenKey = 'access_token'

export function getAuthorizationHeader(): string {
    const accessToken = localStorage.getItem(accessTokenKey)

    if (!accessToken) {
        throw new Error('Se requiere iniciar sesión.')
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

export async function requestJson<T>(url: string, init: RequestInit): Promise<T> {
    const response = await fetch(url, init)

    if (!response.ok) {
        return throwApiError(response)
    }

    return response.json() as Promise<T>
}

export function getJsonHeaders(): HeadersInit {
    return {
        Authorization: getAuthorizationHeader(),
        'Content-Type': 'application/json',
    }
}
