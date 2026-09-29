import type { components, operations } from '@tijuana-reporta/shared'
import type { Users } from './db-types'

export type LoginResponse = operations['login']['responses'][200]['content']['application/json']
export type RegisterResponse = operations['register']['responses'][201]['content']['application/json']
export type MeResponse = operations['me']['responses'][200]['content']['application/json']
export type AuthResponse = LoginResponse | RegisterResponse
export type AuthApiUser = AuthResponse['user'] | MeResponse
export type AuthEndpoint = 'login' | 'register'
export type AuthRequest<T extends AuthEndpoint> =
    operations[T]['requestBody']['content']['application/json']
export type AuthResponseFor<T extends AuthEndpoint> =
    T extends 'login' ? LoginResponse : RegisterResponse
export type AuthContextUser = Omit<Users, 'rol_id' | 'created_at' | 'updated_at'>
    & Partial<Pick<Users, 'rol_id' | 'created_at' | 'updated_at'>>
export type ApiErrorResponse = components['schemas']['error_response']
