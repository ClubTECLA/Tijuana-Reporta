import type { ReactNode } from "react"

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

export interface AuthResponse {
    access_token: string
    user: {
        id: string
        email: string
        username: string
        rol_id: number
        created_at: string
    }
}

export interface subsectionProps {
    debug?: boolean
}