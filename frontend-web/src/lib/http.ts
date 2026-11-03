// Cliente de la API: todas las peticiones del web pasan por aquí. Pone la URL base y el token, aplica el tiempo
// límite, traduce los errores y, si el backend rechaza el token (401), cierra la sesión una sola vez y lo avisa.

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim()

/** Base de la API: VITE_API_URL o /api/v1 (en desarrollo Vite la reenvía al backend; en producción, nginx). */
export const apiUrl = (configuredApiUrl || '/api/v1').replace(/\/+$/, '')

const accessTokenKey = 'access_token'

/** El token de la sesión solo se guarda y se lee aquí; AuthProvider lo pone al entrar y lo quita al salir. */
export const sessionToken = {
    get: () => localStorage.getItem(accessTokenKey),
    set: (token: string) => localStorage.setItem(accessTokenKey, token),
    clear: () => localStorage.removeItem(accessTokenKey),
}

const expiredListeners = new Set<() => void>()

/** Se llama cuando el backend rechaza el token: la sesión ya está cerrada y la interfaz debe reflejarlo. */
export function onSessionExpired(listener: () => void): () => void {
    expiredListeners.add(listener)
    return () => { expiredListeners.delete(listener) }
}

// Solo la primera petición rechazada con el token vigente cierra la sesión: las que van en paralelo
// (p. ej. reportes y categorías del sondeo) llegan con el token ya borrado y no avisan otra vez.
function expireSession(token: string) {
    if (sessionToken.get() !== token) return
    sessionToken.clear()
    for (const listener of expiredListeners) listener()
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

// La cancelación y el tiempo límite pueden llegar al pedir o al leer el cuerpo: en los dos casos se tratan igual.
// Cancelada por quien llamó: se propaga tal cual para que la pueda ignorar.
function requestError(error: unknown, message: string): Error {
    if (error instanceof DOMException && error.name === 'AbortError') return error
    if (error instanceof DOMException && error.name === 'TimeoutError') {
        return new Error('El servidor tardó demasiado en responder.', { cause: error })
    }
    return new Error(message, { cause: error })
}

// Los undefined se omiten y los arrays se repiten (?estado=a&estado=b).
function toQueryString(query: object | undefined): string {
    const searchParams = new URLSearchParams()

    for (const [key, value] of Object.entries(query ?? {})) {
        if (value === undefined) continue

        if (Array.isArray(value)) {
            for (const item of value) searchParams.append(key, String(item))
        } else {
            searchParams.set(key, String(value))
        }
    }

    return searchParams.size > 0 ? `?${searchParams.toString()}` : ''
}

export interface ApiRequestInit extends Omit<RequestInit, 'body'> {
    /** Cuerpo JSON: se serializa y lleva Content-Type. */
    json?: unknown
    /** Cuerpo tal cual, p. ej. FormData (sin Content-Type: el navegador lo pone con el boundary). */
    body?: BodyInit
    /** Parámetros de la URL. */
    query?: object
    /**
     * false en login, registro y logout, que no necesitan sesión. Así además un 401 del login
     * (credenciales incorrectas) no se confunde con una sesión caducada.
     */
    auth?: boolean
}

/** Petición a la API: `path` es relativo a apiUrl (p. ej. "/reportes"). Devuelve el JSON, o undefined con 204. */
export async function apiRequest<T>(path: string, { json, body, query, auth = true, headers, ...init }: ApiRequestInit = {}): Promise<T> {
    const token = auth ? sessionToken.get() : null
    if (auth && !token) {
        throw new Error('Se requiere iniciar sesión.')
    }

    const requestHeaders = new Headers(headers)
    if (token) requestHeaders.set('Authorization', `Bearer ${token}`)
    if (json !== undefined) requestHeaders.set('Content-Type', 'application/json')

    let response: Response
    try {
        response = await fetch(`${apiUrl}${path}${toQueryString(query)}`, {
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
            ...init,
            headers: requestHeaders,
            body: json !== undefined ? JSON.stringify(json) : body,
        })
    } catch (error) {
        throw requestError(error, 'No hay conexión con el servidor.')
    }

    if (response.status === 401 && token) {
        expireSession(token)
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
        throw requestError(error, 'El servidor envió una respuesta inválida.')
    }
}
