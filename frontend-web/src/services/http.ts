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

// Sin respuesta en este tiempo se aborta; quien sube archivos puede pasar su propio `signal` con más margen.
const REQUEST_TIMEOUT_MS = 15_000

// Los servicios que la usan son async: así un error al armar la petición (p. ej. sin sesión en
// getAuthorizationHeader) llega como promesa rechazada y no como excepción síncrona.
export async function requestJson<T>(url: string, init: RequestInit): Promise<T> {
    let response: Response
    try {
        response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS), ...init })
    } catch (error) {
        // Cancelada por quien llamó: se propaga tal cual para que la pueda ignorar.
        if (error instanceof DOMException && error.name === 'AbortError') throw error
        const timedOut = error instanceof DOMException && error.name === 'TimeoutError'
        throw new Error(
            timedOut ? 'El servidor tardó demasiado en responder.' : 'No hay conexión con el servidor.',
            { cause: error },
        )
    }

    if (!response.ok) {
        return throwApiError(response)
    }

    if (response.status === 204) {
        return undefined as T
    }

    try {
        return await response.json() as T
    } catch (error) {
        throw new Error('El servidor envió una respuesta inválida.', { cause: error })
    }
}

export function getJsonHeaders(): HeadersInit {
    return {
        Authorization: getAuthorizationHeader(),
        'Content-Type': 'application/json',
    }
}
