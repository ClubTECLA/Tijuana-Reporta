import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocalStorage } from './useLocalStorage'

const PHOTON_SEARCH_URL = 'https://photon.komoot.io/api/'
const MIN_QUERY_LENGTH = 3
const DEFAULT_SUGGESTION_LIMIT = 3
const PHOTON_FETCH_LIMIT = 50
const PHOTON_SEARCH_TIMEOUT_MS = 2_000
const TIJUANA_CENTER = { latitude: 32.5149, longitude: -117.0382 }
const BAJA_CALIFORNIA_BBOX = '-117.13,28.0,-112.7,32.72'
const SAME_NAME_DISTANCE_METERS = 100
const EARTH_RADIUS_METERS = 6_371_000

export interface PhotonFeature {
    type: 'Feature'
    geometry: {
        type: 'Point'
        coordinates: [longitude: number, latitude: number]
    }
    properties: Record<string, unknown>
    [key: string]: unknown
}

interface PhotonSearchResponse {
    type: 'FeatureCollection'
    features: PhotonFeature[]
}

function normalizeAdministrativeName(value: unknown): string {
    return typeof value === 'string'
        ? value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase()
        : ''
}

function normalizePlaceName(value: unknown): string {
    return typeof value === 'string'
        ? value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().replace(/\s+/g, ' ').toLowerCase()
        : ''
}

function getErrorName(cause: unknown): string | undefined {
    if (typeof cause !== 'object' || cause === null || !('name' in cause)) return undefined
    return typeof cause.name === 'string' ? cause.name : undefined
}

function areNearby(first: PhotonFeature, second: PhotonFeature): boolean {
    const [firstLongitude, firstLatitude] = first.geometry.coordinates
    const [secondLongitude, secondLatitude] = second.geometry.coordinates
    if (![firstLongitude, firstLatitude, secondLongitude, secondLatitude].every(Number.isFinite)) {
        return false
    }

    const toRadians = (degrees: number) => degrees * Math.PI / 180
    const latitudeDifference = toRadians(secondLatitude - firstLatitude)
    const longitudeDifference = toRadians(secondLongitude - firstLongitude)
    const haversine = Math.sin(latitudeDifference / 2) ** 2 +
        Math.cos(toRadians(firstLatitude)) *
        Math.cos(toRadians(secondLatitude)) *
        Math.sin(longitudeDifference / 2) ** 2
    const distance = 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(haversine))

    return distance <= SAME_NAME_DISTANCE_METERS
}

export function filterBajaCaliforniaSuggestions(features: PhotonFeature[], limit: number): PhotonFeature[] {
    const regionalSuggestions = features.filter(({ properties }) => {
        const isMexico = normalizeAdministrativeName(properties.country) === 'mexico' ||
            normalizeAdministrativeName(properties.countrycode) === 'mx'
        return isMexico && normalizeAdministrativeName(properties.state) === 'baja california'
    })

    const uniqueSuggestions: PhotonFeature[] = []
    for (const suggestion of regionalSuggestions) {
        const name = normalizePlaceName(suggestion.properties.name)
        const isNearbyDuplicate = name !== '' && uniqueSuggestions.some((existing) =>
            normalizePlaceName(existing.properties.name) === name && areNearby(existing, suggestion)
        )
        if (!isNearbyDuplicate) uniqueSuggestions.push(suggestion)
    }

    return uniqueSuggestions.slice(0, limit)
}

/**
 * Busca lugares con Photon y mantiene el estado de sugerencias, carga y errores.
 * La API devuelve las coincidencias en orden de relevancia y se limita a Baja California, México.
 */
export function usePhotonSearch() {
    const [searchStorage, setSearchStorage] = useLocalStorage('Almacenamiento de Busqueda')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<Error | null>(null)
    const [searchRequestId, setSearchRequestId] = useState(0)
    const controllerRef = useRef<AbortController | null>(null)

    const clearSearch = useCallback(() => {
        controllerRef.current?.abort()
        controllerRef.current = null
        setSearchRequestId((requestId) => requestId + 1)
        setSearchStorage((storage) => ({ ...storage, current_location_suggestions: [] }))
        setError(null)
        setIsLoading(false)
    }, [setSearchStorage])

    const searchLocations = useCallback(async (
        query: string,
        limit = DEFAULT_SUGGESTION_LIMIT,
    ): Promise<PhotonFeature[]> => {
        const normalizedQuery = query.trim()

        if (normalizedQuery.length < MIN_QUERY_LENGTH) {
            clearSearch()
            return []
        }

        if (!Number.isInteger(limit) || limit < 1) {
            throw new RangeError('El número de sugerencias debe ser un entero positivo.')
        }

        controllerRef.current?.abort()
        const controller = new AbortController()
        controllerRef.current = controller
        setSearchRequestId((requestId) => requestId + 1)
        setSearchStorage((storage) => ({ ...storage, current_location_suggestions: [] }))
        setError(null)
        setIsLoading(true)
        const timeout = window.setTimeout(() => {
            controller.abort(new DOMException('La búsqueda de lugares excedió el tiempo límite.', 'TimeoutError'))
        }, PHOTON_SEARCH_TIMEOUT_MS)

        // Photon solo acepta lang: default, de, en, fr. Se omite para usar
        // "default", que devuelve los nombres locales (en español para Tijuana).
        const params = new URLSearchParams({
            q: normalizedQuery,
            limit: String(Math.max(limit, PHOTON_FETCH_LIMIT)),
            lat: String(TIJUANA_CENTER.latitude),
            lon: String(TIJUANA_CENTER.longitude),
            zoom: '12',
            bbox: BAJA_CALIFORNIA_BBOX,
        })

        try {
            const response = await fetch(`${PHOTON_SEARCH_URL}?${params}`, {
                signal: controller.signal,
            })

            if (!response.ok) {
                throw new Error('No se pudieron buscar lugares.')
            }

            const data = await response.json() as PhotonSearchResponse
            if (!Array.isArray(data.features)) {
                throw new Error('Photon devolvió una respuesta inválida.')
            }

            const results = filterBajaCaliforniaSuggestions(data.features, limit)
            if (controllerRef.current === controller) {
                setSearchStorage((storage) => ({ ...storage, current_location_suggestions: results }))
            }
            return results
        } catch (cause) {
            const causeName = getErrorName(cause)
            const abortReasonName = getErrorName(controller.signal.reason)
            const isTimeoutError = causeName === 'TimeoutError' ||
                (causeName === 'AbortError' && abortReasonName === 'TimeoutError')
            const isAbortError = causeName === 'AbortError' && !isTimeoutError

            if (isTimeoutError) {
                const timeoutError = cause instanceof Error
                    ? cause
                    : new Error('La búsqueda de lugares excedió el tiempo límite.', { cause })
                timeoutError.name = 'TimeoutError'
                if (controllerRef.current === controller) {
                    setError(timeoutError)
                }
                throw timeoutError
            }

            if (isAbortError) return []

            const searchError = cause instanceof Error
                ? cause
                : new Error('No se pudieron buscar lugares.', { cause })
            if (controllerRef.current === controller) {
                setError(searchError)
            }
            throw searchError
        } finally {
            window.clearTimeout(timeout)
            if (controllerRef.current === controller) {
                controllerRef.current = null
                setIsLoading(false)
            }
        }
    }, [clearSearch, setSearchStorage])

    useEffect(() => () => controllerRef.current?.abort(), [])

    return {
        suggestions: searchStorage.current_location_suggestions,
        isLoading,
        error,
        searchRequestId,
        searchLocations,
        clearSearch,
    }
}
