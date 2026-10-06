import type { components, operations } from '@tijuana-reporta/shared'
import type { Users } from './db-types'

// Shared API schemas
export type ApiComentario = components['schemas']['comentario']
export type ApiCrearComentarioRequest = components['schemas']['crear_comentario_request']
export type ApiReporte = components['schemas']['reporte']
export type ApiReporteResumen = components['schemas']['reporte_resumen']
export type ApiEstadoReporte = components['schemas']['estado_reporte']
export type ApiFoto = components['schemas']['foto']
export type ApiTag = components['schemas']['tag']
export type ApiTagCatalogo = components['schemas']['tag_catalogo']
export type ApiCrearTagRequest = components['schemas']['crear_tag_request']
export type ApiLocation = components['schemas']['location']
export type ApiCrearReporteRequest = components['schemas']['crear_reporte_request']
export type ApiRegisterRequest = components['schemas']['register_request']
export type ApiLoginRequest = components['schemas']['login_request']
export type ApiAuthResponse = components['schemas']['auth_response']
export type ApiUsuario = components['schemas']['usuario']
export type ApiUsuarioMeResponse = components['schemas']['usuario_me_response']
export type ApiIncidente = components['schemas']['incidente']
export type ApiCrearIncidenteRequest = components['schemas']['crear_incidente_request']

// Report endpoint query, path, and response types
export type ApiListarReportesQuery = operations['listarReportes']['parameters']['query']
export type ApiListarReportesResponse =
    operations['listarReportes']['responses'][200]['content']['application/json']
export type ApiCrearReporteResponse =
    operations['crearReporte']['responses'][201]['content']['application/json']
export type ApiObtenerReporteParams = operations['obtenerReporte']['parameters']['path']
export type ApiObtenerReporteResponse =
    operations['obtenerReporte']['responses'][200]['content']['application/json']
export type ApiAgregarAvistamientoParams =
    operations['agregarAvistamiento']['parameters']['path']
export type ApiAgregarAvistamientoResponse =
    operations['agregarAvistamiento']['responses'][200]['content']['application/json']
export type ApiCrearComentarioParams =
    operations['crearComentario']['parameters']['path']
export type ApiCrearComentarioResponse =
    operations['crearComentario']['responses'][201]['content']['application/json']

// Authentication endpoint request and response types
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

export type ApiLoginResponse = LoginResponse
export type ApiRegisterResponse = RegisterResponse
export type ApiMeResponse = MeResponse
export type ApiLogoutResponse = operations['logout']['responses'][204]

// Incident endpoint query, path, and response types
export type ApiListarIncidentesQuery =
    operations['listarIncidentes']['parameters']['query']
export type ApiListarIncidentesResponse =
    operations['listarIncidentes']['responses'][200]['content']['application/json']
export type ApiCrearIncidenteResponse =
    operations['crearIncidente']['responses'][201]['content']['application/json']
export type ApiObtenerIncidenteParams =
    operations['obtenerIncidente']['parameters']['path']
export type ApiObtenerIncidenteResponse =
    operations['obtenerIncidente']['responses'][200]['content']['application/json']
export type ApiAgregarTagsParams = operations['agregarTags']['parameters']['path']
export type ApiAgregarTagsRequest =
    operations['agregarTags']['requestBody']['content']['application/json']
export type ApiAgregarTagsResponse =
    operations['agregarTags']['responses'][201]['content']['application/json']
