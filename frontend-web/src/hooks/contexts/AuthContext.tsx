import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type {
    ApiErrorResponse,
    AuthApiUser,
    AuthContextUser,
    AuthEndpoint,
    AuthRequest,
    AuthResponseFor,
    MeResponse,
} from '../../types/api-types'
import { apiUrl} from '../../types/global-variables'

const accessTokenKey = 'access_token'

interface AuthContextType {
    user: AuthContextUser | null
    isAuthenticated: boolean
    isLoading: boolean
    login: (email: string, password: string) => Promise<void>
    register: (email: string, username: string, password: string) => Promise<void>
    logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function toUser(user: AuthApiUser): AuthContextUser {
    return {
        id: user.id,
        email: user.email,
        username: user.username,
        phone: null,
        password_hash: null,
        rol_id: 'rol_id' in user ? user.rol_id : undefined,
        created_at: 'created_at' in user ? user.created_at : undefined,
        updated_at: 'created_at' in user ? user.created_at : undefined,
        rol_name: 'rol_name' in user ? user.rol_name : undefined,
    }
}

async function readError(response: Response): Promise<string> {
    try {
        const data = await response.json() as ApiErrorResponse
        return data.message ?? 'No se pudo completar la solicitud.'
    } catch {
        return 'No se pudo completar la solicitud.'
    }
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthContextUser | null>(null);
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
                return response.json() as Promise<MeResponse>
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


    const authenticate = async <T extends AuthEndpoint>(endpoint: T, body: AuthRequest<T>) => {
        const response = await fetch(`${apiUrl}/auth/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        })

        if (!response.ok) {
            throw Object.assign(new Error(await readError(response)), { status: response.status })
        }

        const data = await response.json() as AuthResponseFor<T>

        localStorage.setItem(accessTokenKey, data.access_token)

        setUser(toUser(data.user))
    }

    const login = (email: string, password: string) =>
        authenticate('login', { email, password })

    const register = (email: string, username: string, password: string) =>
        authenticate('register', { email, username, password })

    const logout = async () => {

        try{
            await fetch(`${apiUrl}/auth/logout`,{
                method: 'POST',
            })
        }catch(error){
            console.error('Logout request failed:', error)
        }finally{
            localStorage.removeItem(accessTokenKey)
            setUser(null)
        }
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
