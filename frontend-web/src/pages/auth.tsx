import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useRouter } from '../hooks/useRouter'
import {FaLocationDot} from "react-icons/fa6"


const formsInputsDivsStyle = `
    flex flex-col gap-2 w-full max-w-xs
`
const inputsLabelsStyle = `
    text-sm font-medium text-gray-600
`

const inputsStyle = `
    border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
`

const submitButtonStyle = `
    bg-blue-500 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
`
const formsStyle = `
    flex flex-col gap-4 w-full max-w-xs
`
function SignInPage() {

    return (
        <div>
            <form className={formsStyle}>
                <div className={formsInputsDivsStyle}>
                    <label className={inputsLabelsStyle}>Correo electrónico o Numero de celular</label>
                    <input type="text"  className={inputsStyle} />
                </div>                
                <div className={formsInputsDivsStyle}>
                    <label className={inputsLabelsStyle}>Password</label>
                    <input type="password"  className={inputsStyle} />
                </div>
                <div className="text-sm text-gray-600">
                    <a href="#" className="text-blue-500 hover:underline">¿Olvidaste tu contraseña?</a>
                </div>
                <div className={formsInputsDivsStyle}>
                    <button type="submit" className={submitButtonStyle}>Iniciar sesión</button>
                </div>                
            </form>
        </div>
    )
}

function SignUpPage() {
    return(
        <div>
            <form className={formsStyle}>
                <div className={formsInputsDivsStyle}>
                    <label className={inputsLabelsStyle}>Correo electrónico</label>
                    <input type="text"  className={inputsStyle} />
                </div>
                <div className={formsInputsDivsStyle}>
                    <label className={inputsLabelsStyle}>Numero de celular</label>
                    <input type="text"  className={inputsStyle} />
                </div>
                <div className={formsInputsDivsStyle}>
                    <label className={inputsLabelsStyle}>Password</label>
                    <input type="password"  className={inputsStyle} />
                </div>
                <div className={formsInputsDivsStyle}>
                    <button type="submit" className={submitButtonStyle}>Registrarse</button>
                </div>
            </form>
        </div>
    )
}

export default function AuthPage() {
    const [searchParams] = useSearchParams()
    const [ tab , setTab ] = useState('login');
    const router = useRouter();
    
    useEffect(() => {
        const tabParam = searchParams.get('tab');
        if (tabParam === 'login' || tabParam === 'register') {
            setTab(tabParam);
        }
    }, []);


    const changeTabButtonSelectedStyle = `
        px-4 py-2 rounded-md text-white font-semibold bg-blue-500
    `

    const changeTabButtonStyle = `
        px-4 py-2 rounded-md text-gray-400 font-semibold
    `

    return(
        <div className="flex flex-row items-center justify-center min-h-screen py-2">
            
            <div className="flex flex-col items-center justify-center w-2/3 bg-gray-600 h-screen">
                <div className="relative h-screen w-full bg-gradient-to-t from-white to-transparent">
                    <div className="absolute  bottom-0 flex flex-col gap-4 border-t border-gray-800 w-full h-2/5">
                        <div className="flex flex-row items-center border-2 border-green-500 gap-6 px-10">
                            <div className="bg-blue-500 rounded-full p-4">
                                <FaLocationDot className="text-6xl text-white"/>
                            </div>
                            <h1 className="text-7xl font-bold text-gray-800">Tijuana Reporta</h1>                        
                        </div>
                        <div className="border-2 border-blue-800 px-10">
                            <h2 className="text-md font-semibold text-gray-500">Alerta Ciudadana</h2>
                        </div>
                        <div className="border-2 border-blue-800 px-10">
                            <h2 className="text-xl text-gray-700 font-bold">Reporta incidentes ocasionados en la ciudad. La comunidad confirma y todos se enteran antes de salir.</h2>
                        </div>
                    </div>
                </div>

            </div>

            <div className="flex flex-col items-center justify-center w-1/3 gap-4">
                <h1 className="text-2xl font-bold mb-4">{tab === 'login' ? 'Iniciar sesión' : 'Registrarse'}</h1>
                <div>
                    <button onClick={() => {
                            setTab('login');
                        }}
                        className={tab === 'login' ? changeTabButtonSelectedStyle : changeTabButtonStyle}
                    >
                        Iniciar sesión
                    </button>
                    <button onClick={() => {
                            setTab('register');
                        }}
                        className={tab === 'register' ? changeTabButtonSelectedStyle : changeTabButtonStyle}
                    >
                        Registrarse
                    </button>
                </div>
                <div>
                    {tab === 'login' ? <SignInPage /> : <SignUpPage />}
                    <h1 className="text-center text-sm font-semibold text-gray-700 my-3">O</h1>
                    <div className="text-center font-bold border-2 border-gray-300 w-full">**Boton de Google**</div>
                </div>
            </div>
        </div>  
    )
}