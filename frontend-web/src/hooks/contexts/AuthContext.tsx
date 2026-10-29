import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type {
    AuthApiUser,
    AuthContextUser,
    AuthEndpoint,
    AuthRequest,
    AuthResponseFor,
    MeResponse,
} from '../../types/api-types'
import { apiRequest, onSessionExpired, sessionToken } from '../../services/http'
import { useSysMessage } from './SysMessageContext'
import { AuthContext } from './AuthContext.ts'

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

/**
 * Sesión del usuario: restaura la sesión al recargar y expone login, registro y logout. El token lo guarda el cliente
 * de la API (services/http.ts); si el backend lo rechaza, el cliente cierra la sesión y aquí solo se avisa.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
    const { showMessage } = useSysMessage()
    const [user, setUser] = useState<AuthContextUser | null>(null);
    const [isLoading, setIsLoading] = useState(() => sessionToken.get() !== null)

    async function loadUser(): Promise<void> {
        const token = sessionToken.get()
        if (!token) return

        try {
            const currentUser = await apiRequest<MeResponse>('/auth/me')
            // Si mientras tanto se cerró o cambió la sesión, la respuesta ya no es de este usuario.
            if (sessionToken.get() === token) setUser(toUser(currentUser))
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        // Un token caducado responde 401 y lo resuelve onSessionExpired; ante otro error (p. ej. sin conexión)
        // el token se conserva para no obligar a entrar de nuevo por un fallo pasajero.
        loadUser().catch((error: unknown) => {
            console.error('Failed to load current user:', error)
        });
    }, [])

    useEffect(() => onSessionExpired(() => {
        setUser(null)
        showMessage('Tu sesión expiró. Vuelve a iniciar sesión para seguir.', { color: 'yellow', type: 'float', title: 'Sesión' })
    }), [showMessage])

    const authenticate = async <T extends AuthEndpoint>(endpoint: T, body: AuthRequest<T>) => {
        setUser(null);
        const data = await apiRequest<AuthResponseFor<T>>(`/auth/${endpoint}`, { method: 'POST', json: body, auth: false })
        sessionToken.set(data.access_token)
        await loadUser()
    }

    const login = (email: string, password: string) =>
        authenticate('login', { email, password })

    const register = (email: string, username: string, password: string) =>
        authenticate('register', { email, username, password })

    /** Cierra la sesión en el backend y borra el token guardado, aunque la petición falle. */
    const logout = async () => {
        try {
            // El backend no guarda el token (security: [] en el contrato): no hace falta enviarlo.
            await apiRequest('/auth/logout', { method: 'POST', auth: false })
        } catch (error) {
            console.error('Logout request failed:', error)
        } finally {
            sessionToken.clear()
            setUser(null)
        }
    }

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    )
}
