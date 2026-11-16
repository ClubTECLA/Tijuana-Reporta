import { describe, expect, it } from 'vitest'
import { filterBajaCaliforniaSuggestions, type PhotonFeature } from './usePhotonSearch'

function feature(
    properties: Record<string, unknown>,
    coordinates: [longitude: number, latitude: number] = [-117.0382, 32.5149],
): PhotonFeature {
    return {
        type: 'Feature',
        geometry: { type: 'Point', coordinates },
        properties,
    }
}

describe('filterBajaCaliforniaSuggestions', () => {
    it('mantiene únicamente resultados de México y Baja California', () => {
        const results = [
            feature({ country: 'Mexico', state: 'Baja California' }),
            feature({ countrycode: 'mx', state: 'Baja California' }),
            feature({ country: 'Mexico', state: 'Baja California Sur' }),
            feature({ country: 'United States', state: 'California' }),
        ]

        expect(filterBajaCaliforniaSuggestions(results, 10)).toEqual(results.slice(0, 2))
    })

    it('aplica el límite después de filtrar la región', () => {
        const results = [
            feature({ country: 'United States', state: 'California' }),
            feature({ country: 'Mexico', state: 'Baja California' }),
            feature({ country: 'Mexico', state: 'Baja California' }),
        ]

        expect(filterBajaCaliforniaSuggestions(results, 1)).toEqual([results[1]])
    })

    it('elimina nombres repetidos cuando sus puntos están a menos de 100 metros', () => {
        const first = feature({
            name: 'Parque Central',
            country: 'Mexico',
            state: 'Baja California',
        }, [-117.0382, 32.5149])
        const nearbyDuplicate = feature({
            name: ' parque  central ',
            country: 'Mexico',
            state: 'Baja California',
        }, [-117.0382, 32.515])

        expect(filterBajaCaliforniaSuggestions([first, nearbyDuplicate], 10)).toEqual([first])
    })

    it('conserva nombres iguales cuando los puntos están claramente separados', () => {
        const first = feature({
            name: 'Parque Central',
            country: 'Mexico',
            state: 'Baja California',
        }, [-117.0382, 32.5149])
        const distantPlace = feature({
            name: 'Parque Central',
            country: 'Mexico',
            state: 'Baja California',
        }, [-116.95, 32.55])

        expect(filterBajaCaliforniaSuggestions([first, distantPlace], 10)).toEqual([first, distantPlace])
    })

    it('no elimina lugares cercanos si sus nombres son diferentes', () => {
        const first = feature({
            name: 'Parque Central',
            country: 'Mexico',
            state: 'Baja California',
        })
        const differentPlace = feature({
            name: 'Plaza Central',
            country: 'Mexico',
            state: 'Baja California',
        })

        expect(filterBajaCaliforniaSuggestions([first, differentPlace], 10)).toEqual([first, differentPlace])
    })
})
