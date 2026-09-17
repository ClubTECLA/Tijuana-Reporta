import { createContext, useContext, useState, useEffect } from 'react'
import type {ReactNode} from 'react'
import type { Users } from '../../types/db-types'

interface AuthContextType {
    user: Users | null
    isAuthenticated: boolean
    isLoading: boolean
    login: (username: string, password: string) => void
    logout: () => void
}


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<Users | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        if(user && !isLoading) return;
        setIsLoading(true);
        
        try{
            // get user from database and set it to state
        }catch(error){
            console.error('Failed to fetch user:', error);
            setUser(null);
        }finally{
            setIsLoading(false);
        }

    }, [user]);

    const login = (username: string, password: string) => {
        try{
        // fetch user from database and set it to state
        }catch(error){
            console.error('Login failed:', error);
            setUser(null);
        }
    }

    const logout = () => {
        try{
            // clear user from state and database
        }catch(error){
            console.error('Logout failed:', error);
        }
        setUser(null);
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