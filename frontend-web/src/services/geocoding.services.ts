// Geocodificación con Nominatim (OpenStreetMap), igual que frontend-mobile/src/features/lugares/nominatim.ts.
// Política de uso: máx. ~1 petición/s; por eso solo se consulta al buscar o al soltar el marcador.
// shortcut: Nominatim público sin SLA, válido para desarrollo; en producción pasar por un proxy o proveedor propio.
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org'

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

async function nominatim<T>(path: string, params: Record<string, string>): Promise<T> {
    const query = new URLSearchParams({ format: 'jsonv2', addressdetails: '1', 'accept-language': 'es', ...params })
    const response = await fetch(`${NOMINATIM_URL}/${path}?${query}`)

    if (!response.ok) {
        throw new Error('No se pudo consultar la dirección.')
    }

    return response.json() as Promise<T>
}

/** Primera coincidencia de una dirección escrita, o null si no hay resultados. */
export async function buscarDireccion(text: string): Promise<GeocodingResult | null> {
    const [result] = await nominatim<NominatimResult[]>('search', {
        q: text,
        limit: '1',
        viewbox: TIJUANA_VIEWBOX,
        countrycodes: 'mx',
    })

    if (!result) return null

    return { latitude: Number(result.lat), longitude: Number(result.lon), address: shortAddress(result) }
}

/** Dirección aproximada de unas coordenadas, o null si Nominatim no la encuentra. */
export async function direccionDe(latitude: number, longitude: number): Promise<string | null> {
    const result = await nominatim<NominatimResult | { error: string }>('reverse', {
        lat: String(latitude),
        lon: String(longitude),
        zoom: '18',
    })

    return 'error' in result ? null : shortAddress(result)
}
