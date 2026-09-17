import { createContext, useContext, useState } from 'react'
import type {ReactNode} from 'react'
import type { Users } from '../../types/db-types'

interface AuthContextType {
    user: Users | null
    isAuthenticated: boolean
    isLoading: boolean
    login: () => void
    logout: () => void
}


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<Users | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const login = () => {
    
    }

    const logout = () => {
    }

    return(
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}   

export const useAuth = () => {
    const context = useContext(AuthContext);
    
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    return context;
}