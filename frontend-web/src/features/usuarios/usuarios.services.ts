import type { ApiListarRolesResponse, ApiListarUsuariosResponse } from '@/types/api-types'
import { apiRequest } from '@/lib/http'

// GET /users (administradores)
export async function listarUsuarios(): Promise<ApiListarUsuariosResponse> {
    return apiRequest('/users')
}

// GET /roles (administradores)
export async function listarRoles(): Promise<ApiListarRolesResponse> {
    return apiRequest('/roles')
}
