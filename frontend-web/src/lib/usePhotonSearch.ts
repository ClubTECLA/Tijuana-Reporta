import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocalStorage } from './useLocalStorage'

const PHOTON_SEARCH_URL = 'https://photon.komoot.io/api/'
const MIN_QUERY_LENGTH = 3
const DEFAULT_SUGGESTION_LIMIT = 3
const TIJUANA_CENTER = { latitude: 32.5149, longitude: -117.0382 }

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

/**
 * Busca lugares con Photon y mantiene el estado de sugerencias, carga y errores.
 * La API devuelve las coincidencias en orden de relevancia y se sesga hacia Tijuana.
 */
export function usePhotonSearch() {
    const [searchStorage, setSearchStorage] = useLocalStorage('Almacenamiento de Busqueda')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<Error | null>(null)
    const controllerRef = useRef<AbortController | null>(null)

    const clearSearch = useCallback(() => {
        controllerRef.current?.abort()
        controllerRef.current = null
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
        setSearchStorage((storage) => ({ ...storage, current_location_suggestions: [] }))
        setError(null)
        setIsLoading(true)

        // Photon solo acepta lang: default, de, en, fr. Se omite para usar
        // "default", que devuelve los nombres locales (en español para Tijuana).
        const params = new URLSearchParams({
            q: normalizedQuery,
            limit: String(limit),
            lat: String(TIJUANA_CENTER.latitude),
            lon: String(TIJUANA_CENTER.longitude),
            zoom: '12',
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

            const results = data.features.slice(0, limit)
            if (controllerRef.current === controller) {
                setSearchStorage((storage) => ({ ...storage, current_location_suggestions: results }))
            }
            return results
        } catch (cause) {
            if (controller.signal.aborted) return []

            const searchError = cause instanceof Error
                ? cause
                : new Error('No se pudieron buscar lugares.', { cause })
            if (controllerRef.current === controller) {
                setError(searchError)
            }
            throw searchError
        } finally {
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
        searchLocations,
        clearSearch,
    }
}
