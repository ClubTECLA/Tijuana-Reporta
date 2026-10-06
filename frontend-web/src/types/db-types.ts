// Base catalog
export interface Incidente {
  id: number
  nombre: string
  tiempo_limite: number | null
  radio: number | null
}

export interface Tags {
  id: number
  incidente_id: number
  nombre: string
  peso: number
}

export interface Roles {
  id: number
  nombre: string
}

// API - Incident catalog schemas
export type ApiTagCatalogo = {
  id: number
  nombre: string
  peso: number
}

export type ApiIncidente = {
  id: number
  nombre: string
  tiempo_limite: number | null
  radio: number | null
  color: string
  tags: ApiTagCatalogo[]
  esta_activo: boolean
}

// API - Incident creation requests
export type ApiCrearTagRequest = {
  nombre: string
  peso?: number
}

export type ApiCrearIncidenteRequest = {
  nombre: string
  tiempo_limite?: number
  radio?: number
  esta_activo?: boolean
  color?: string
  tags?: ApiCrearTagRequest[]
}

// API - Report schemas linked to an incident
export type ApiEstadoReporte =
  | "Pendiente"
  | "Probable"
  | "Verificado"
  | "Resuelto"
  | "Descartado"
  | "Expirado"

export type ApiReporteResumen = {
  id: string
  incidente_id: number
  estado_actual: ApiEstadoReporte
  avistamientos: number
  es_oficial: boolean
  latitude: number
  longitude: number
}

export type ApiCrearReporteRequest = {
  incidente_id: number
  latitude: number
  longitude: number
  image_path?: string
}

// API - Nested report schemas
export type ApiComentario = {
  id: number
  reporte_id: string
  user_id: string
  comentario: string
  created_at: string
}

export type ApiFoto = {
  id: number
  image_path: string
  user_id: string
  created_at: string
}

export type ApiTag = {
  id: number
  nombre: string
  count: number
}

export type ApiLocation = {
  id: number
  latitude: number
  longitude: number
  user_id: string
  created_at: string
}

export type ApiReporte = {
  id: string
  incidente_id: number
  avistamientos: number
  es_historico: boolean
  es_oficial: boolean
  estado_actual: ApiEstadoReporte
  latitude: number
  longitude: number
  created_at: string
  updated_at: string
  expired_at?: string
  comentarios: ApiComentario[]
  fotos: ApiFoto[]
  tags: ApiTag[]
  locations: ApiLocation[]
}

// Users and authentication
export interface Users {
  id: string
  email: string | null
  phone: string | null
  username: string
  rol_id: number
  password_hash: string | null
  created_at: string
  updated_at: string
  rol_name?: string 
}

export interface AuthProviders {
  id: string
  user_id: string
  provider: string
  provider_id: string | null
  created_at: string
}

// Report status
export type Estado = 'Sin revisar' | 'En revision' | 'Arreglado' | 'Expirado'

export const Estado = {
  SinRevisar: 'Sin revisar',
  EnRevision: 'En revision',
  Arreglado: 'Arreglado',
  Expirado: 'Expirado',
} as const satisfies Record<string, Estado>

// Reports
export interface Reporte {
  id: string
  incidente_id: number
  avistamientos: number
  es_historico: boolean
  estado_actual: Estado
  created_at: string
  updated_at: string
  expired_at: string | null
}

export interface Location {
  id: number
  reporte_id: string
  latitude: number
  longitude: number
  user_id: string
  created_at: string
}

export interface PuntosOrigen {
  reporte_id: string
  latitude: number
  longitude: number
  sample_count: number
  updated_at: string
}

export interface FotosReporte {
  id: number
  reporte_id: string
  image_path: string
  user_id: string
  created_at: string
}

// Report tags
export interface IncidenteTag {
  id: number
  reporte_id: string
  tag_id: number
  added_by: string
  created_at: string
}

export interface ReporteTagCounts {
  reporte_id: string
  tag_id: number
  count: number
}

export interface ReportesScores {
  reporte_id: string
  total_score: number
}

// Comments and history
export interface Comentarios {
  id: number
  reporte_id: string
  user_id: string
  comentario: string
  created_at: string
}

export interface UsersReports {
  id: number
  user_id: string
  reporte_id: string
}

export interface Logs {
  id: string
  incidente_id: number
  longitude: number
  latitude: number
  peso: number
  started_at: string
  finished_at: string
}

