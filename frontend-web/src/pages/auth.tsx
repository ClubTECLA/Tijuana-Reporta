import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {FaLocationDot} from "react-icons/fa6"
import { SysMessage, useSysMessage } from '../hooks/contexts/SysMessageContext'
import { useAuth } from '../hooks/contexts/AuthContext'


const formsInputsDivsStyle = `
    flex flex-col gap-2 w-full
`
const inputsLabelsStyle = `
    text-sm font-medium text-gray-600
`

const inputsStyle = `
    border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
`

const submitButtonStyle = `
    bg-blue-500 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 disabled:hover:bg-gray-300 disabled:focus:ring-0
`
const formsStyle = `
    flex flex-col gap-4 w-full max-w-md rounded-xl bg-white py-8 px-10 shadow-xl items-center justify-center
`
function SignInPage() {
    const { showMessage, cleanMessage } = useSysMessage();
    const { login } = useAuth();
    const navigate = useNavigate();
    const [ remainingAttempts, setRemainingAttempts ] = useState(3);
    const [ form, setForm] = useState({
        email: '',
        password: ''
    })

    const handleChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if(remainingAttempts >= 0)
            cleanMessage();
        setForm({
            ...form, 
            [e.target.name]: e.target.value
        })
    }   

    const handleSubmit = async (e: React.SubmitEvent) => {
        e.preventDefault();

        if(remainingAttempts === 0){
            showMessage("Vuelve a intentar ingresar mas tarde.", 'red', "Sin intentos")
            return;
        }


        if(form.email.length === 0 || form.password.length === 0){
            showMessage("Asegurate de rellenar correctamente todos los campos solicitados.", {'type': 'inline','color': 'red', 'showTime': null, 'title':"Campos Faltantes"})
            return;
        }

        try{
            await login(form.email, form.password);
            navigate('/');
        }catch(error){
            console.error('Error:', error);
            const attemptsAfterFailure = Math.max(remainingAttempts - 1, 0);
            showMessage(
                error instanceof Error ? error.message : 'Error al comprobar las credenciales',
                'red',
                attemptsAfterFailure === 0 ? "Sin intentos" : "Credenciales no válidas"
            );
            setRemainingAttempts(attemptsAfterFailure);
        }

    }

    return (
        <div className="w-full flex items-center justify-center">
            <form 
                className={formsStyle}
                onSubmit={handleSubmit}  
            >
                <div className={formsInputsDivsStyle}>
                    <h1 className="text-4xl font-bold">Iniciar sesión</h1>
                    <span className="text-sm text-gray-600">Usa tu correo institucional. Las cuentas las crea un administrador</span>
                </div>
                <SysMessage />
                <div className={formsInputsDivsStyle}>
                    <label className={inputsLabelsStyle}>Correo institucional</label>
                    <input 
                        type="text"  
                        className={inputsStyle} 
                        value={form.email} 
                        onChange={handleChangeInput}
                        name={"email"}
                    />
                </div>
                <div className={formsInputsDivsStyle}>
                    <label className={inputsLabelsStyle}>Contraseña</label>
                    <input 
                        type="password"  
                        className={inputsStyle} 
                        value={form.password} 
                        onChange={handleChangeInput}
                        name={"password"}
                    />
                </div>
                <div className="flex flex-rowtext-sm text-gray-600">
                    <label className="w-1/3"><input type="checkbox"/> Recordar este equipo </label>
                    <a href="#" className="w-2/3 text-blue-500 text-end hover:underline">¿Olvidaste tu contraseña?</a>
                </div>
                <div className={formsInputsDivsStyle}>
                    <button 
                        type="submit" 
                        className={submitButtonStyle}
                        disabled={remainingAttempts === 0}
                        aria-disabled={remainingAttempts === 0}
                    >Iniciar sesión</button>
                </div>                
                <h1 className="text-center text-sm font-semibold text-gray-700 my-3">O</h1>
                    <div className="text-center font-bold w-full">**Boton de Google**</div>
                <Link
                    to="/auth?tab=register"
                    className="w-full text-center border border-blue-500 text-blue-500 font-semibold py-2 px-4 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                    Crear cuenta
                </Link>
            </form>
        </div>
    )
}

function RegisterPage() {
    const { register } = useAuth();
    const navigate = useNavigate();
    const { showMessage } = useSysMessage();
    const [form, setForm] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    })

    const handleChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        })
    }

    const handleSubmit = async (e: React.SubmitEvent) => {
        e.preventDefault()
        if (form.password !== form.confirmPassword) {
            showMessage('Las contraseñas no coinciden.', 'red', 'Registro')
            return
        }

        try {
            await register(form.email, form.username, form.password)
            navigate('/')
        } catch (error) {
            console.error('Registration failed:', error)
            showMessage(
                error instanceof Error ? error.message : 'No se pudo crear la cuenta.',
                'red',
                'Registro'
            )
        }
    }

    return(
        <div className="w-full flex items-center justify-center">
            <form className={formsStyle} onSubmit={handleSubmit}>
                <div className={formsInputsDivsStyle}>
                    <h1 className="text-4xl font-bold">Crear cuenta</h1>
                    <span className="text-sm text-gray-600">
                        Regístrate para comenzar a reportar incidentes en Tijuana
                    </span>
                </div>
                <SysMessage />
                <div className={formsInputsDivsStyle}>
                    <label className={inputsLabelsStyle} htmlFor="register-username">Nombre de usuario</label>
                    <input
                        id="register-username"
                        name="username"
                        type="text"
                        className={inputsStyle}
                        value={form.username}
                        onChange={handleChangeInput}
                        autoComplete="username"
                        required
                    />
                </div>
                <div className={formsInputsDivsStyle}>
                    <label className={inputsLabelsStyle} htmlFor="register-email">Correo electrónico</label>
                    <input
                        id="register-email"
                        name="email"
                        type="email"
                        className={inputsStyle}
                        value={form.email}
                        onChange={handleChangeInput}
                        autoComplete="email"
                        required
                    />
                </div>
                <div className={formsInputsDivsStyle}>
                    <label className={inputsLabelsStyle} htmlFor="register-password">Contraseña</label>
                    <input
                        id="register-password"
                        name="password"
                        type="password"
                        className={inputsStyle}
                        value={form.password}
                        onChange={handleChangeInput}
                        autoComplete="new-password"
                        minLength={8}
                        required
                    />
                </div>
                <div className={formsInputsDivsStyle}>
                    <label className={inputsLabelsStyle} htmlFor="register-confirm-password">Confirmar contraseña</label>
                    <input
                        id="register-confirm-password"
                        name="confirmPassword"
                        type="password"
                        className={inputsStyle}
                        value={form.confirmPassword}
                        onChange={handleChangeInput}
                        autoComplete="new-password"
                        minLength={8}
                        required
                    />
                </div>
                <div className={formsInputsDivsStyle}>
                    <button type="submit" className={submitButtonStyle}>Registrarse</button>
                </div>
                <Link
                    to="/auth?tab=login"
                    className="text-center text-sm text-blue-500 hover:underline"
                >
                    Ya tengo una cuenta
                </Link>
            </form>
        </div>
    )
}

export default function AuthPage() {
    const [searchParams] = useSearchParams()
    const tabParam = searchParams.get('tab');
    const tab = tabParam === 'register' ? 'register' : 'login';


    const trendLineChartDivStyle = `
        bg-gray-200/10 shadow-md rounded-xl flex flex-col px-4 py-1
    `

    return(
        <>
        <div className="pointer-events-none fixed h-screen w-screen bg-gradient-to-r from-blue-900/80 from-0% via-blue-400/20 via-50% to-blue-400/10 to-100%"/>

        <div className="flex flex-row items-center  min-h-screen bg-gray-300">
            
            <div className="relative h-screen w-2/4">
                <div className="absolute top-1/3 left-10 flex flex-col gap-4 w-2/3 h-2/5">
                    <div className="flex flex-row items-center gap-6">
                        <div className="bg-blue-500 rounded-xl p-3">
                            <FaLocationDot className="text-2xl text-white"/>
                        </div>
                        <h1 className="text-3xl font-bold text-white">Tijuana Reporta</h1>                        
                    </div>
                    <div>
                        <h2 className="text-xl text-white">Panel de operación para Protección Civil y personal autorizado</h2>
                    </div>
                    <div>
                        <h2 className="text-sm text-blue-100">Reporta incidentes ocasionados en la ciudad. La comunidad confirma y todos se enteran antes de salir.</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className={trendLineChartDivStyle}>
                            <span className='text-gray-100 font-bold text-xl'>{23}</span>
                            <span className="text-xs text-white">Incidentes activos</span>
                        </div>
                        <div className={trendLineChartDivStyle}>
                            <span className='text-gray-100 font-bold text-xl'>{1240}</span>
                            <span className="text-xs text-white">Personas notificadas hoy</span>
                        </div>
                    </div>
                </div>
                <span className="absolute bottom-2 left-10 text-xs text-gray-200">
                    Uso exclusivo de personal autorizado · Actividad registrada en bitácora
                </span>
            </div>

            <div className="flex items-center justify-center w-2/4">
                    {tab === 'login' ? <SignInPage /> : <RegisterPage />}
            </div>
        </div>
        
        </>  
    )
}