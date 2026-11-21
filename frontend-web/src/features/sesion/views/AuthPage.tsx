import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { IoIosArrowBack } from 'react-icons/io'
import { LuMapPin } from 'react-icons/lu'
import { useCommonPanel } from '@/panels/useCommonPanel'
import useModals from '@/panels/useModals'
import { RecoveryFlow } from '@/features/sesion/components/RecoveryFlow'
import { SignInForm } from '@/features/sesion/components/SignInForm'


/** Página /auth del Figma: marca, formulario y métricas sobre la captura del mapa; en móvil se apilan en una columna. */
export default function AuthPage() {
    const {closePanel} = useCommonPanel();
    const {closeModal} = useModals();
    const {search} = useLocation();
    const navigate = useNavigate();
    const [form, setForm] = useState(() =>
        new URLSearchParams(search).get("tab") === "recovery" ? "recovery" : "login"
    );

    const showForm = (nextForm: "login" | "recovery", replace = false) => {
        setForm(nextForm);
        navigate(`?tab=${nextForm}`, { replace });
    };

    const trendLineChartDivStyle = `
        flex flex-1 flex-col gap-0.5 rounded-2xl bg-white/12 px-4 py-3 lg:flex-none
    `
    useEffect(() => {
        closeModal()
        closePanel()
    }, [closeModal, closePanel]);

    return(
        <div className="relative min-h-screen w-full font-ui">
            {/* Captura del fondo del Figma */}
            <Link
                to="/"
                aria-label="Volver al mapa"
                className="
                    group absolute left-4 top-4 z-50 inline-flex items-center gap-1.5
                    text-surface
                    transition-[transform,background-color,color,box-shadow] duration-300 ease-out
                    hover:scale-105
                    motion-reduce:transition-none
                    sm:left-6 sm:top-6 sm:gap-2 sm:px-4
                    lg:left-[7.29%] lg:top-8
                "
            >
                <IoIosArrowBack className="size-6 transition-transform duration-300 group-hover:-translate-x-1 motion-reduce:transition-none sm:size-7"/>
                <span className="text-base font-semibold sm:text-lg">Mapa</span>
            </Link>
            <img src="/auth/fondo.webp" alt="" aria-hidden="true" className="pointer-events-none fixed inset-0 size-full object-cover object-left lg:object-center" />

            <div className="relative flex min-h-screen flex-col px-4 py-8 pt-20 sm:px-8 sm:pt-24 lg:py-10 lg:pl-[7.29%] lg:pr-[10.42%]">
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
                            <div className="flex size-12 shrink-0 items-center justify-center rounded-[14px] bg-brand lg:size-16 lg:rounded-[18px]">
                                <LuMapPin className="size-6.5 text-white lg:size-8.5"/>
                            </div>
                            <h1 className="text-[32px] font-bold text-white lg:text-[40px]">ClimAlert</h1>
                        </div>
                        <h2 className="text-title font-semibold leading-7.5 text-white lg:text-[30px] lg:leading-9.5">Panel de operación para Protección Civil y personal autorizado</h2>
                        <h2 className="text-body leading-6 text-blue-100 lg:text-[17px] lg:leading-6.5">Revisa reportes ciudadanos, verifica incidentes y avisa a la comunidad en tiempo real durante la temporada de El Niño.</h2>
                    </div>

                    <div className="flex justify-center [grid-area:card] lg:items-center lg:justify-end">
                        {form === "login"
                            ? <SignInForm onForgotPassword={() => showForm("recovery")} />
                            : (
                                <RecoveryFlow
                                    onBackToLogin={() => showForm("login")}
                                    onComplete={() => showForm("login", true)}
                                />
                            )}
                    </div>

                    <div className="flex flex-row gap-3 whitespace-nowrap [grid-area:stats] lg:self-start">
                        <div className={trendLineChartDivStyle}>
                            <span className='text-title font-bold text-white'>{23}</span>
                            <span className="text-caption text-blue-100">Incidentes activos</span>
                        </div>
                        <div className={trendLineChartDivStyle}>
                            <span className='text-title font-bold text-white'>{1240}</span>
                            <span className="text-caption text-blue-100">Personas notificadas hoy</span>
                        </div>
                    </div>
                </div>

                <span className="mx-auto mt-8 w-full max-w-130 text-caption text-line-soft lg:absolute lg:bottom-6 lg:left-[7.29%] lg:mt-0 lg:w-auto lg:max-w-none">
                    Uso exclusivo de personal autorizado · Actividad registrada en bitácora
                </span>
            </div>
        </div>
    )
}
