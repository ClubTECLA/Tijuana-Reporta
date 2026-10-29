import type { ApiCrearReporteResponse } from '../types/api-types'
import { cambiarEstadoReporte, crearComentario, crearReporte } from './reportes.services'

export interface NuevoReporte {
    /** Categoría elegida (en el backend, incidente_id). */
    categoriaId: number
    latitude: number
    longitude: number
    /** Texto libre; vacío no se guarda. */
    descripcion: string
}

export interface Publicacion {
    reporte: ApiCrearReporteResponse
    /** Pasos que fallaron después de crear el reporte, en frases para el aviso ("la descripción no se pudo guardar"). */
    pendientes: string[]
}

// Llamadas a la API que usa la publicación; los tests pasan unas falsas.
export const publicacionApi = { crearReporte, crearComentario, cambiarEstadoReporte }

const ok = () => true
const failed = () => false

/**
 * Publica un reporte desde el web: lo crea, guarda la descripción como primer comentario y lo marca como verificado.
 * Si falla crearlo, lanza el error y no queda nada. Si falla un paso posterior, el reporte ya existe y no se reintenta
 * para no duplicarlo: el paso fallido se devuelve en `pendientes` para avisar al usuario.
 */
export async function publicarReporte(nuevo: NuevoReporte, api = publicacionApi): Promise<Publicacion> {
    const reporte = await api.crearReporte({
        incidente_id: nuevo.categoriaId,
        latitude: nuevo.latitude,
        longitude: nuevo.longitude,
    })
    const pendientes: string[] = []

    const descripcion = nuevo.descripcion.trim()
    // shortcut: dos llamadas no atómicas; pasar la descripción en crearReporte cuando el backend acepte "comentario".
    if (descripcion && !await api.crearComentario(reporte.id, descripcion).then(ok, failed)) {
        pendientes.push('la descripción no se pudo guardar')
    }

    // shortcut: PRUEBA. Los incidentes creados desde el web nacen verificados con una segunda llamada (solo admin).
    // Pasar estado y es_oficial en crearReporte cuando el backend los acepte (validando el rol); hoy es_oficial
    // no se puede activar desde ningún endpoint, así que el incidente queda verificado pero no oficial.
    if (!await api.cambiarEstadoReporte(reporte.id, 'Verificado').then(ok, failed)) {
        pendientes.push('no se pudo marcar como verificado')
    }

    return { reporte, pendientes }
}
