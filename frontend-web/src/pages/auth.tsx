import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LuMapPin, LuShield } from "react-icons/lu"
import { SysMessage, useSysMessage } from '../hooks/contexts/SysMessageContext'
import { useAuth } from '../hooks/contexts/AuthContext'
import { useCommonPanel } from '../hooks/contexts/CommonPanelContext'
import useModals from '../hooks/useModals'


const formsInputsDivsStyle = `
    flex flex-col gap-1.5 w-full
`
const inputsLabelsStyle = `
    text-sm font-semibold text-[#111827]
`

const inputsStyle = `
    h-11 w-full rounded-[31px] border border-[#d9e0e8] bg-white px-3
    text-sm text-[#111827] outline-none transition-colors duration-200
    focus:border-[#2677e6]
`

const submitButtonStyle = `
    h-15 w-full rounded-full bg-[#2677e6] px-7 text-lg font-bold text-white
    drop-shadow-[0_3px_1.55px_rgba(38,119,230,0.35)] transition-colors duration-200
    hover:bg-[#1f6bd4] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2677e6] focus-visible:ring-offset-2
    disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:drop-shadow-none disabled:hover:bg-slate-300
`
const formsStyle = `
    flex w-full max-w-130 flex-col items-start gap-4.5
    rounded-[28px] bg-white px-6 pt-8 pb-7 sm:px-10 sm:pt-10 sm:pb-9
    shadow-[0_6px_18px_-4px_rgba(0,0,0,0.12)]
`
const titleStyle = `text-2xl font-bold text-[#111827] sm:text-[28px]`
const subtitleStyle = `text-[15px] leading-5.5 text-[#475569]`

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
            const invalidCredentials = error instanceof Error
                && 'status' in error
                && error.status === 401;
            const attemptsAfterFailure = invalidCredentials
                ? Math.max(remainingAttempts - 1, 0)
                : remainingAttempts;
            showMessage(
                error instanceof Error ? error.message : 'Error al comprobar las credenciales',
                'red',
                invalidCredentials && attemptsAfterFailure === 0
                    ? "Sin intentos"
                    : invalidCredentials
                        ? "Credenciales no válidas"
                        : "Error al iniciar sesión"
            );
            setRemainingAttempts(attemptsAfterFailure);
        }

    }

    return (
        <form
            className={formsStyle}
            onSubmit={handleSubmit}
        >
            <h1 className={titleStyle}>Iniciar sesión</h1>
            <span className={subtitleStyle}>Usa tu correo institucional. Las cuentas las crea un administrador</span>
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
            <div className="flex w-full items-center gap-2 text-sm text-[#475569]">
                <label className="flex flex-1 cursor-pointer items-center gap-2">
                    <input type="checkbox" className="size-4.5 cursor-pointer accent-[#2677e6]"/> Recordar este equipo
                </label>
                <a href="#" className="font-semibold text-[#176edf] hover:underline">¿Olvidaste tu contraseña?</a>
            </div>
            <button
                type="submit"
                className={submitButtonStyle}
                disabled={remainingAttempts === 0}
                aria-disabled={remainingAttempts === 0}
            >Iniciar sesión</button>
            <div className="flex w-full items-center gap-4.75">
                <span className="h-px flex-1 bg-[#e2e8f0]" />
                <span className="text-sm text-[#6c7278]">O</span>
                <span className="h-px flex-1 bg-[#e2e8f0]" />
            </div>
            {/* El inicio de sesión con Google aún no está conectado. */}
            <button
                type="button"
                disabled
                title="Próximamente"
                className="
                    flex h-15 w-full items-center justify-center gap-3 rounded-[51px]
                    border border-[#eff0f6] bg-white px-7
                    text-base font-semibold text-[#1a1c1e]
                    shadow-[0_1px_3px_rgba(0,0,0,0.15)] disabled:cursor-not-allowed
                "
            >
                <img src="/auth/google.svg" alt="" className="size-5.25" />
                Continuar con Google
            </button>
            <div className="flex w-full items-center gap-2.5 rounded-[14px] bg-[#f1f5f9] px-3.5 py-3">
                <LuShield className="size-4.5 shrink-0 text-[#475569]" />
                <span className="text-[13px] text-[#475569]">¿Eres ciudadano? Descarga la app Tijuana Reporta para reportar incidentes.</span>
            </div>
        </form>
    )
}

export default function AuthPage() {
    const {closePanel} = useCommonPanel();
    const {closeModal} = useModals();


    const trendLineChartDivStyle = `
        flex flex-1 flex-col gap-0.5 rounded-2xl bg-white/12 px-4 py-3 lg:flex-none
    `

    useEffect(() => {
        closeModal()
        closePanel()
    }, []);

    return(
        <div className="relative min-h-screen w-full font-['Inter',sans-serif]">
            {/* Captura del fondo del Figma */}
            <img src="/auth/fondo.webp" alt="" aria-hidden="true" className="pointer-events-none fixed inset-0 size-full object-cover object-left lg:object-center" />

            <div className="relative flex min-h-screen flex-col px-4 py-8 sm:px-8 lg:py-10 lg:pl-[7.29%] lg:pr-[10.42%]">
                {/*
                  Móvil: marca → tarjeta → métricas, en una columna.
                  Escritorio (lg): composición del Figma, marca y métricas a la izquierda y la tarjeta a la derecha.
                */}
                <div
                    className="
                        mx-auto my-auto grid w-full max-w-130 gap-6
                        [grid-template-areas:'brand'_'card'_'stats']
                        lg:max-w-none lg:grid-cols-[minmax(0,560px)_minmax(0,520px)] lg:justify-between lg:gap-x-10 lg:gap-y-5
                        lg:[grid-template-areas:'brand_card'_'stats_card']
                    "
                >
                    <div className="flex flex-col gap-4 [grid-area:brand] lg:gap-5 lg:self-end">
                        <div className="flex flex-row items-center gap-3 lg:gap-4">
                            <div className="flex size-12 shrink-0 items-center justify-center rounded-[14px] bg-[#2677e6] lg:size-16 lg:rounded-[18px]">
                                <LuMapPin className="size-6.5 text-white lg:size-8.5"/>
                            </div>
                            <h1 className="text-[32px] font-bold text-white lg:text-[40px]">ClimAlert</h1>
                        </div>
                        <h2 className="text-[22px] font-semibold leading-7.5 text-white lg:text-[30px] lg:leading-9.5">Panel de operación para Protección Civil y personal autorizado</h2>
                        <h2 className="text-[15px] leading-6 text-[#dbeafe] lg:text-[17px] lg:leading-6.5">Revisa reportes ciudadanos, verifica incidentes y avisa a la comunidad en tiempo real durante la temporada de el Niño.</h2>
                    </div>

                    <div className="flex justify-center [grid-area:card] lg:items-center lg:justify-end">
                        <SignInPage />
                    </div>

                    <div className="flex flex-row gap-3 whitespace-nowrap [grid-area:stats] lg:self-start">
                        <div className={trendLineChartDivStyle}>
                            <span className='text-[22px] font-bold text-white'>{23}</span>
                            <span className="text-[13px] text-[#dbeafe]">Incidentes activos</span>
                        </div>
                        <div className={trendLineChartDivStyle}>
                            <span className='text-[22px] font-bold text-white'>{1240}</span>
                            <span className="text-[13px] text-[#dbeafe]">Personas notificadas hoy</span>
                        </div>
                    </div>
                </div>

                <span className="mx-auto mt-8 w-full max-w-130 text-[13px] text-[#e2e8f0] lg:absolute lg:bottom-6 lg:left-[7.29%] lg:mt-0 lg:w-auto lg:max-w-none">
                    Uso exclusivo de personal autorizado · Actividad registrada en bitácora
                </span>
            </div>
        </div>
    )
}
