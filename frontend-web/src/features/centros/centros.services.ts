import type { ApiCentro, ApiCrearCentroRequest, ApiTipoCentro } from '@/types/api-types'
import { apiRequest } from '@/lib/http'

// La ruta del backend es /centro, en singular (shared/openapi/paths/centros.yaml).

// GET /centro: solo los activos
export async function listarCentros(): Promise<ApiCentro[]> {
    return apiRequest('/centro')
}

// GET /tipos-centro: el catálogo (Refugios, Rescate, Salud, Seguridad...), ordenado por nombre
export async function listarTiposCentro(): Promise<ApiTipoCentro[]> {
    return apiRequest('/tipos-centro')
}

// POST /centro (administradores)
export async function crearCentro(body: ApiCrearCentroRequest): Promise<ApiCentro> {
    return apiRequest('/centro', { method: 'POST', json: body })
}
