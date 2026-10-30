import { createContext } from 'react'
import type { AuthContextUser } from '../../types/api-types'

// El contexto solo declara el contrato; el Provider de .tsx lo conecta con el cliente de la API.
export interface AuthContextType {
    user: AuthContextUser | null
    isAuthenticated: boolean
    isLoading: boolean
    login: (email: string, password: string) => Promise<void>
    register: (email: string, username: string, password: string) => Promise<void>
    logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)
