import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useRouter } from '../hooks/useRouter'

export default function AuthPage() {
    const [searchParams] = useSearchParams()
    const [ tab , setTab ] = useState('login');
    
    useEffect(() => {
        const tabParam = searchParams.get('tab');
        if (tabParam === 'login' || tabParam === 'register') {
            setTab(tabParam);
        }
    }, []);

    


    return(
        <div className="flex flex-col items-center justify-center min-h-screen py-2">
            
        </div>  
    )
}