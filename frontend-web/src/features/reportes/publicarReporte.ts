import type { ApiCrearReporteResponse } from '@/types/api-types'
import { cambiarEstadoReporte, crearComentario, crearReporte, subirMultimedia } from './reportes.services'

// Límite del backend para la dirección del reporte (crear_reporte_request.yaml).
const DIRECCION_MAX_LENGTH = 255

export interface NuevoReporte {
    /** Categoría elegida (en el backend, incidente_id). */
    categoriaId: number
    latitude: number
    longitude: number
    /** Dirección del marcador; vacía no se guarda y el detalle muestra las coordenadas. */
    direccion: string
    /** Texto libre; vacío no se guarda. */
    descripcion: string
    /** Foto ya preparada con prepararFoto. */
    foto?: Blob
}

/** Por qué no se guardó la foto de un reporte ya creado. */
export interface FalloFoto {
    /** Frase para el aviso ("la foto es demasiado grande para el servidor"). */
    motivo: string
    /** Vale la pena reintentar solo la foto con el mismo reporte (red o almacenamiento caídos). */
    reintentable: boolean
}

export interface Publicacion {
    reporte: ApiCrearReporteResponse
    /** Pasos que fallaron después de crear el reporte, en frases para el aviso ("la descripción no se pudo guardar"). */
    pendientes: string[]
    /** null si no había foto o se guardó. */
    falloFoto: FalloFoto | null
}

// Llamadas a la API que usa la publicación; los tests pasan unas falsas.
export const publicacionApi = { crearReporte, crearComentario, cambiarEstadoReporte, subirMultimedia }

const ok = () => true
const failed = () => false
const statusOf = (error: unknown) => (error as { status?: number } | null)?.status

/** Traduce el error de la subida según la tabla de multimedia/README.md. */
export function falloFoto(error: unknown): FalloFoto {
    switch (statusOf(error)) {
        case 413:
        case 422:
            return { motivo: 'la foto es demasiado grande para el servidor', reintentable: false }
        case 400:
            return { motivo: 'el servidor no aceptó el formato de la foto', reintentable: false }
        case 401:
        case 403:
        case 404:
            return { motivo: 'no tienes permiso para subir fotos a este reporte', reintentable: false }
        case 503:
            return { motivo: 'el almacenamiento de fotos no está disponible', reintentable: true }
        default:
            // Sin conexión, tiempo límite u otro error del servidor.
            return { motivo: 'la foto no se pudo subir', reintentable: true }
    }
}

/**
 * Sube (o reintenta) solo la foto de un reporte ya creado; nunca lo recrea. Devuelve null si quedó guardada.
 * Un 409 cuenta como guardada: este usuario ya tiene su foto en el reporte, p. ej. de un intento anterior que llegó
 * al servidor aunque aquí se agotara el tiempo.
 */
export async function subirFoto(reporteId: string, foto: Blob, api = publicacionApi): Promise<FalloFoto | null> {
    try {
        await api.subirMultimedia(reporteId, foto)
        return null
    } catch (error) {
        return statusOf(error) === 409 ? null : falloFoto(error)
    }
}

/**
 * Publica un reporte oficial desde el web: lo crea con su dirección y luego, a la vez, guarda la descripción como
 * primer comentario, lo marca como verificado y sube la foto.
 * Si falla crearlo, lanza el error y no queda nada. Si falla un paso posterior, el reporte ya existe y no se reintenta
 * para no duplicarlo: el paso fallido se devuelve en `pendientes`, y la foto en `falloFoto` para poder reintentarla sola.
 */
export async function publicarReporte(nuevo: NuevoReporte, api = publicacionApi): Promise<Publicacion> {
    // El web solo lo usan roles oficiales: el backend responde 403 si quien publica es ciudadano.
    const reporte = await api.crearReporte({
        incidente_id: nuevo.categoriaId,
        latitude: nuevo.latitude,
        longitude: nuevo.longitude,
        es_oficial: true,
        direccion: nuevo.direccion.trim().slice(0, DIRECCION_MAX_LENGTH) || undefined,
    })

    // shortcut: llamadas no atómicas tras crear el reporte. Juntar descripción y estado en crearReporte cuando el
    // backend acepte "comentario" y "estado" al crear (la foto siempre va aparte: es multipart).
    const descripcion = nuevo.descripcion.trim()
    const [descripcionGuardada, verificado, fallo] = await Promise.all([
        descripcion ? api.crearComentario(reporte.id, descripcion).then(ok, failed) : true,
        // Los reportes oficiales siempre nacen verificados.
        api.cambiarEstadoReporte(reporte.id, 'Verificado').then(ok, failed),
        nuevo.foto ? subirFoto(reporte.id, nuevo.foto, api) : null,
    ])

    const pendientes = [
        !descripcionGuardada && 'la descripción no se pudo guardar',
        !verificado && 'no se pudo marcar como verificado',
    ].filter((paso) => paso !== false)

    return { reporte, pendientes, falloFoto: fallo }
}
