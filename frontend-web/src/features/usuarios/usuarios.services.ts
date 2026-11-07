import type { ApiListarUsuariosResponse } from '@/types/api-types'
import { apiRequest } from '@/lib/http'

// GET /users (administradores)
export async function listarUsuarios(): Promise<ApiListarUsuariosResponse> {
    return apiRequest('/users')
}
