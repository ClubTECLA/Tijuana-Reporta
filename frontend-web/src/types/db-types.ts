import type { ReactNode } from "react"

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

//extra types
export type componentProps = {
  className?: string,
  onClick?: () => void
}

export type NavItem = {
  icon: ReactNode
  title: string
  destinationPath: string
  cantNoti?: number
}
