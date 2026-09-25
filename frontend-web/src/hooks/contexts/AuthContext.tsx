import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { Users, AuthResponse } from '../../types/db-types'
import { apiUrl } from '../../types/global-variables'


const accessTokenKey = 'access_token'

interface AuthContextType {
    user: Users | null
    isAuthenticated: boolean
    isLoading: boolean
    login: (email: string, password: string) => Promise<void>
    register: (email: string, username: string, password: string) => Promise<void>
    logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function toUser(user: AuthResponse['user']): Users {
    return {
        ...user,
        phone: null,
        password_hash: null,
        updated_at: user.created_at,
    }
}

async function readError(response: Response): Promise<string> {
    try {
        const data = await response.json() as { message?: string }
        return data.message ?? 'No se pudo completar la solicitud.'
    } catch {
        return 'No se pudo completar la solicitud.'
    }
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<Users | null>(null)
    const [isLoading, setIsLoading] = useState(() => localStorage.getItem(accessTokenKey) !== null)

    useEffect(() => {
        const token = localStorage.getItem(accessTokenKey)
        if (!token) return

        fetch(`${apiUrl}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(async (response) => {
                if (!response.ok) {
                    throw new Error(await readError(response))
                }
                return response.json() as Promise<AuthResponse['user']>
            })
            .then((currentUser) => {
                if (localStorage.getItem(accessTokenKey) === token) {
                    setUser(toUser(currentUser))
                }
            })
            .catch(() => {
                if (localStorage.getItem(accessTokenKey) !== token) return
                localStorage.removeItem(accessTokenKey)
                setUser(null)
            })
            .finally(() => setIsLoading(false))
    }, [])

    const authenticate = async (endpoint: 'login' | 'register', body: object) => {
        console.log("apiUrl:", apiUrl)
        const response = await fetch(`${apiUrl}/auth/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        })

        if (!response.ok) {
            throw Object.assign(new Error(await readError(response)), { status: response.status })
        }

        const data = await response.json() as AuthResponse

        localStorage.setItem(accessTokenKey, data.access_token)

        setUser(toUser(data.user))
    }

    const login = (email: string, password: string) =>
        authenticate('login', { email, password })

    const register = (email: string, username: string, password: string) =>
        authenticate('register', { email, username, password })

    const logout = () => {
        localStorage.removeItem(accessTokenKey)
        setUser(null)
    }

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
