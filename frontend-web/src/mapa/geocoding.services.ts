// Geocodificación con Nominatim (OpenStreetMap), igual que frontend-mobile/src/features/lugares/nominatim.ts.
// Política de uso: máx. 1 petición/s. nominatim() pone en cola las peticiones de esta pestaña: salen en orden y cada
// una al menos 1 s después del inicio real de la anterior. Quien llama puede cancelar con un AbortSignal, y lo
// cancelado no ocupa turno.
// shortcut: el límite es por pestaña, no global; Nominatim público sin SLA, válido para desarrollo; en producción
// pasar por un proxy o proveedor propio.
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org'
const MIN_INTERVAL_MS = 1_000

// Cola de turnos: cada petición espera a la anterior y guarda cuándo salió de verdad.
let queue: Promise<void> = Promise.resolve()
let lastStart = 0

function wait(ms: number, signal?: AbortSignal) {
    return new Promise<void>((resolve, reject) => {
        const timer = setTimeout(resolve, ms)
        signal?.addEventListener('abort', () => { clearTimeout(timer); reject(signal.reason) }, { once: true })
    })
}

function nextTurn(signal?: AbortSignal): Promise<void> {
    const turn = queue.then(async () => {
        signal?.throwIfAborted()
        const delay = lastStart + MIN_INTERVAL_MS - Date.now()
        if (delay > 0) await wait(delay, signal)
        lastStart = Date.now()
    })
    // Una petición cancelada no frena a las siguientes.
    queue = turn.catch(() => undefined)
    return turn
}

// Tijuana y sus delegaciones: sesga los resultados sin descartar direcciones de fuera.
const TIJUANA_VIEWBOX = '-117.15,32.60,-116.85,32.40'

interface NominatimAddress {
    road?: string
    house_number?: string
    neighbourhood?: string
    suburb?: string
    city_district?: string
    city?: string
}

interface NominatimResult {
    lat: string
    lon: string
    display_name: string
    address?: NominatimAddress
}

export type GeocodingResult = {
    latitude: number
    longitude: number
    address: string
}

// "Avenida Constitución 120 · Zona Centro"; si no hay calle, las dos primeras partes del nombre completo.
function shortAddress(result: NominatimResult): string {
    const a = result.address
    const street = [a?.road, a?.house_number].filter(Boolean).join(' ')
    const area = a?.neighbourhood ?? a?.suburb ?? a?.city_district ?? a?.city
    if (street) return area ? `${street} · ${area}` : street
    return result.display_name.split(',').slice(0, 2).join(',').trim()
}

async function nominatim<T>(path: string, params: Record<string, string>, signal?: AbortSignal): Promise<T> {
    const query = new URLSearchParams({ format: 'jsonv2', addressdetails: '1', 'accept-language': 'es', ...params })

    await nextTurn(signal)
    const response = await fetch(`${NOMINATIM_URL}/${path}?${query}`, { signal })

    if (!response.ok) {
        throw new Error('No se pudo consultar la dirección.')
    }

    return response.json() as Promise<T>
}

/** Primera coincidencia de una dirección escrita, o null si no hay resultados. */
export async function buscarDireccion(text: string, signal?: AbortSignal): Promise<GeocodingResult | null> {
    const [result] = await nominatim<NominatimResult[]>('search', {
        q: text,
        limit: '1',
        viewbox: TIJUANA_VIEWBOX,
        countrycodes: 'mx',
    }, signal)

    if (!result) return null

    return { latitude: Number(result.lat), longitude: Number(result.lon), address: shortAddress(result) }
}

/** Dirección aproximada de unas coordenadas, o null si Nominatim no la encuentra. */
export async function direccionDe(latitude: number, longitude: number, signal?: AbortSignal): Promise<string | null> {
    const result = await nominatim<NominatimResult | { error: string }>('reverse', {
        lat: String(latitude),
        lon: String(longitude),
        zoom: '18',
    }, signal)

    return 'error' in result ? null : shortAddress(result)
}
