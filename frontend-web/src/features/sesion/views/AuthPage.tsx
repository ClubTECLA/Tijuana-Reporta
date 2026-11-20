import React, { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LuCircleCheckBig, LuMapPin, LuShield } from "react-icons/lu"
import { SysMessage, useSysMessage } from '@/components/ui/SysMessageContext'
import { useAuth } from '@/features/sesion/useAuth'
import { useCommonPanel } from '@/panels/useCommonPanel'
import useModals from '@/panels/useModals'
import { IoChevronBack } from 'react-icons/io5'
import { FiInfo, FiLock, FiMail } from 'react-icons/fi'
import { GoPaperAirplane } from 'react-icons/go'
import { FaRegQuestionCircle } from 'react-icons/fa'
import { IoIosArrowBack } from 'react-icons/io'
import { solicitarRecuperacion, verificarRecuperacion } from '@/features/sesion/recovery.service'


const formsInputsDivsStyle = `
    flex flex-col gap-1.5 w-full
`
const inputsLabelsStyle = `
    text-sm font-semibold text-ink
`

const inputsStyle = `
    h-11 w-full rounded-[31px] border border-line bg-white px-4
    text-sm text-ink outline-none transition-colors duration-200
    focus:border-brand
`

const submitButtonStyle = `
    h-15 w-full rounded-full bg-brand px-7 text-lg font-bold text-white
    drop-shadow-button-brand transition duration-200
    hover:brightness-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2
    disabled:cursor-not-allowed disabled:bg-line-strong disabled:text-ink-muted disabled:drop-shadow-none disabled:hover:brightness-100
`
const formsStyle = `
    flex w-full max-w-130 flex-col items-start gap-4.5
    rounded-[28px] bg-white px-6 pt-8 pb-7 sm:px-10 sm:pt-10 sm:pb-9
    shadow-float
`
const titleStyle = `text-2xl font-bold text-ink sm:text-[28px]`
const subtitleStyle = `text-body leading-5.5 text-ink-secondary`

interface RecoveryEmailProps {
    email: string
    onChangeEmail: (event: ChangeEvent<HTMLInputElement>) => void
    onSubmit: (email: string) => Promise<void>
    submitting: boolean
}

function Recovery_email({ email, onChangeEmail, onSubmit, submitting }: RecoveryEmailProps) {
    const handleSubmit = ( e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        void onSubmit(email);
    }

    return(
        <form
            className={`w-full h-fit`}
            onSubmit={(e) => handleSubmit(e)}
        >
            <h1 className={titleStyle}>Recupera tu contraseña</h1>
            <span className={subtitleStyle}>Escribe tu correo institucional. Te enviaremos un código a ese correo.</span>
            <div className={`${formsInputsDivsStyle} mt-4`}>
                <label htmlFor="email" className={inputsLabelsStyle}>Correo institucional</label>
                <input
                    id="email"
                    type='email'
                    className={inputsStyle}
                    autoComplete="email"
                    onChange={onChangeEmail}
                    value={email}
                    required
                />    
            </div>  
            <button
                className={`${submitButtonStyle} mt-4 flex flex-row items-center justify-center gap-2`}
                type='submit'
                disabled={submitting}
            >
                <GoPaperAirplane className="-rotate-45 text-xl"/>
                <span>{submitting ? 'Enviando…' : 'Enviar código'}</span>
            </button>
            <div className="flex w-full items-center gap-2.5 rounded-[14px] bg-subtle px-3.5 py-3 mt-4">
                <FaRegQuestionCircle className="size-4.5 shrink-0 text-ink-secondary" />
                <span className="text-caption text-ink-secondary">¿No tienes acceso a tu correo? Pide a un administrador que actualice tu cuenta.</span>
            </div>        
        </form>
    )
}

interface RecoveryCodeProps {
    code: string
    onChangeCode: (code: string) => void
    onSubmit: (code: string) => void
    onResend: () => Promise<boolean>
    submitting: boolean
}

function Recovery_code({code, onChangeCode, onSubmit, onResend, submitting}: RecoveryCodeProps) {
    const [secondsRemaining, setSecondsRemaining] = useState(45);
    const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
    const digits = Array.from({ length: 6 }, (_, index) => code[index] ?? "");
    const isCodeComplete = /^\d{6}$/.test(code);

    useEffect(() => {
        if (secondsRemaining === 0) return;

        const timeout = window.setTimeout(() => {
            setSecondsRemaining((remaining) => Math.max(remaining - 1, 0));
        }, 1000);

        return () => window.clearTimeout(timeout);
    }, [secondsRemaining]);

    const handleChange = (index: number, value: string) => {
        const digit = value.replace(/\D/g, "").slice(-1);
        const nextCode = [...digits];
        nextCode[index] = digit;
        onChangeCode(nextCode.join(""));

        if (digit && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    }

    const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Backspace" && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        } else if (event.key === "ArrowLeft" && index > 0) {
            inputRefs.current[index - 1]?.focus();
        } else if (event.key === "ArrowRight" && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    }

    const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
        const pastedCode = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        if (!pastedCode) return;

        event.preventDefault();
        onChangeCode(pastedCode);
        inputRefs.current[Math.min(pastedCode.length, 5)]?.focus();
    }

    const handleSubmit = (event: React.SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (isCodeComplete) onSubmit(code);
    }

    const handleResend = async () => {
        if (await onResend()) {
            onChangeCode("");
            setSecondsRemaining(45);
        }
    }

    return(
        <form
            className={`w-full h-fit`}
            onSubmit={handleSubmit}
        >
            <h1 className={titleStyle}>Ingresa el código de recuperación</h1>
            <span className={subtitleStyle}>Enviamos un código de 6 dígitos a tu correo.</span>
            <div
                className="mt-5 flex w-full justify-between gap-2"
                onPaste={handlePaste}
                role="group"
                aria-label="Código de recuperación de 6 dígitos"
            >
                {Array.from({length: 6}, (_, index) => (
                    <input
                        key={index}
                        ref={(element) => { inputRefs.current[index] = element; }}
                        aria-label={`Dígito ${index + 1} del código`}
                        autoComplete={index === 0 ? "one-time-code" : "off"}
                        inputMode="numeric"
                        disabled={submitting}
                        maxLength={1}
                        type="text"
                        value={digits[index]}
                        onChange={(event) => handleChange(index, event.target.value)}
                        onKeyDown={(event) => handleKeyDown(index, event)}
                        className="
                            h-20 min-w-0 flex-1 
                            rounded-2xl border 
                            border-line bg-white 
                            text-center text-3xl 
                            font-bold text-ink 
                            outline-none transition-colors 
                            focus:border-blue-500 
                            focus:ring-2 focus:ring-blue-100"
                    />
                ))}
            </div>
            <span
                className="text-sm text-gray-500 block mt-4"
            >
                ¿No llegó? {secondsRemaining > 0
                    ? `Puedes reenviar en ${`${Math.floor(secondsRemaining / 60)}:${String(secondsRemaining % 60).padStart(2, "0")}`}.`
                    : "Puedes solicitar un nuevo código."}
            </span>
            <button
                className="mt-2 text-sm font-semibold text-blue-600 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
                disabled={secondsRemaining > 0 || submitting}
                onClick={() => void handleResend()}
            >
                Reenviar código
            </button>
            <button
                className={`${submitButtonStyle} mt-5`}
                type="submit"
                disabled={!isCodeComplete || submitting}
            >
                Continuar
            </button>
        </form>
    )
}

interface RecoveryPasswordProps {
    onSubmit: (password: string) => Promise<void>
    submitting: boolean
}

function Recovery_changePassword({onSubmit, submitting}: RecoveryPasswordProps) {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const requirements = [
        { label: "Al menos 10 caracteres", met: password.length >= 10 },
        {
            label: "Una mayúscula y un número",
            met: /[A-Z]/.test(password) && /\d/.test(password),
        },
        { label: "Un símbolo (!, #, $)", met: /[!#$]/.test(password) },
        { label: "Máximo 72 bytes", met: new TextEncoder().encode(password).length <= 72 },
    ];
    const isPasswordValid = requirements.every(({met}) => met);
    const passwordsMatch = password.length > 0 && password === confirmPassword;

    const handleSubmit = (event: React.SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (isPasswordValid && passwordsMatch) void onSubmit(password);
    }

    return(
        <form
            className={`w-full h-fit`}
            onSubmit={handleSubmit}
        >
            <h1 className={titleStyle}>Crea una nueva contraseña</h1>
            <span className={subtitleStyle}>Elige una contraseña nueva. Confirmaremos el código al guardarla.</span>
            <div className={`${formsInputsDivsStyle} mt-4`}>
                <label htmlFor="recovery-new-password" className={inputsLabelsStyle}>Nueva contraseña</label>
                <input
                    id="recovery-new-password"
                    type="password"
                    autoComplete="new-password"
                    className={inputsStyle}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={submitting}
                    required
                />
            </div>
            <ul className="mt-2 flex flex-col gap-1 text-sm" aria-label="Requisitos de contraseña">
                {requirements.map(({label, met}) => (
                    <li key={label} className={`flex items-center gap-2 ${met ? "text-emerald-600" : "text-ink-muted"}`}>
                        {met
                            ? <LuCircleCheckBig className="size-4 shrink-0" aria-hidden="true" />
                            : <FiInfo className="size-4 shrink-0" aria-hidden="true" />}
                        {label}
                    </li>
                ))}
            </ul>
            <div className={`${formsInputsDivsStyle} mt-4`}>
                <label htmlFor="recovery-confirm-password" className={inputsLabelsStyle}>Confirmar contraseña</label>
                <input
                    id="recovery-confirm-password"
                    type="password"
                    autoComplete="new-password"
                    className={`${inputsStyle} ${
                        confirmPassword.length === 0
                            ? ""
                            : passwordsMatch
                                ? "border-emerald-500"
                                : "border-red-500"
                    }`}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    disabled={submitting}
                    aria-invalid={confirmPassword.length > 0 && !passwordsMatch}
                    required
                />
                {confirmPassword.length > 0 && !passwordsMatch && (
                    <span className="text-sm text-red-600" role="alert">Las contraseñas no coinciden.</span>
                )}
            </div>
            <button
                className={`${submitButtonStyle} mt-5`}
                type="submit"
                disabled={!isPasswordValid || !passwordsMatch || submitting}
            >
                {submitting ? 'Guardando…' : 'Actualizar contraseña'}
            </button>
        </form>
    )
}

interface RecoveryPasswordFormProps {
    onBackToLogin: () => void
    onComplete: () => void
}

function RecoveryPasswordForm({ onBackToLogin, onComplete }: RecoveryPasswordFormProps) {
    const { showMessage, cleanMessage } = useSysMessage();
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const submittingRef = useRef(false);

    const requestRecovery = async (targetEmail: string, advanceToCode: boolean) => {
        if (submittingRef.current) return false;
        submittingRef.current = true;
        setSubmitting(true);
        cleanMessage();

        try {
            await solicitarRecuperacion({ email: targetEmail });
            if (advanceToCode) {
                setEmail(targetEmail);
                setCode("");
                setStep(2);
            }
            showMessage(
                "Si hay una cuenta que pueda recuperarse con ese correo, recibirás un código. Revisa también la carpeta de spam.",
                { color: "blue", type: "inline", showTime: null, title: "Solicitud recibida" },
            );
            return true;
        } catch (error) {
            const status = error instanceof Error && "status" in error ? error.status : undefined;
            showMessage(
                status === 429
                    ? "Se realizaron demasiadas solicitudes. Espera un momento antes de volver a intentarlo."
                    : error instanceof Error
                        ? error.message
                        : "No se pudo solicitar el código. Inténtalo de nuevo.",
                { color: "red", type: "inline", showTime: null, title: "No se pudo enviar el código" },
            );
            return false;
        } finally {
            submittingRef.current = false;
            setSubmitting(false);
        }
    };

    const verifyRecovery = async (newPassword: string) => {
        if (submittingRef.current) return;
        submittingRef.current = true;
        setSubmitting(true);
        cleanMessage();

        try {
            await verificarRecuperacion({ email, pin: code, new_password: newPassword });
            showMessage(
                "Tu contraseña se actualizó correctamente. Ya puedes iniciar sesión.",
                { color: "green", type: "inline", showTime: null, title: "Contraseña actualizada" },
            );
            onComplete();
        } catch (error) {
            const status = error instanceof Error && "status" in error ? error.status : undefined;
            showMessage(
                status === 400
                    ? "El código es inválido o expiró. Revisa los seis dígitos o solicita uno nuevo."
                    : status === 429
                        ? "Se realizaron demasiados intentos. Espera un momento antes de volver a intentarlo."
                        : error instanceof Error
                            ? error.message
                            : "No se pudo actualizar la contraseña. Inténtalo de nuevo.",
                { color: "red", type: "inline", showTime: null, title: "No se pudo actualizar la contraseña" },
            );
        } finally {
            submittingRef.current = false;
            setSubmitting(false);
        }
    };

    return(
        <section
            className={formsStyle}
        >
            {step > 1 &&
                <button
                    type="button"
                    className="flex flex-row items-center justify-star gap-2 text-sm
                        text-blue-600 font-bold hover:bg-blue-100 transition-all duration-300
                        rounded-lg pr-2 py-2
                    "
                    onClick={() => {
                        cleanMessage();
                        setStep(step - 1);
                    }}
                >
                    <IoChevronBack/>
                    {step === 2 ? "Cambiar correo" : "Cambiar código"}
                </button> 
            }
            {step === 1 && 
                <button
                    type="button"
                    className="flex flex-row items-center justify-start gap-2 text-sm
                        text-blue-600 font-bold hover:bg-blue-100 transition-all duration-300
                        rounded-lg pr-2 py-2
                    "
                    onClick={onBackToLogin}
                >
                    <IoChevronBack/>
                    Volver a iniciar sesión
                </button>
            }
            {[1,2].includes(step) ? 
                <div className="
                        flex items-center justify-center rounded-xl bg-blue-100
                        p-3 text-blue-600 text-2xl
                    "
                >
                    {step === 1 ? <FiLock/> : <FiMail/>}
                </div>
            :    
                <div className="
                        flex items-center justify-center rounded-xl bg-green-100
                        p-3 text-green-600 text-2xl
                    "
                >
                    <LuCircleCheckBig/>
                </div>
            }
            <SysMessage />
            {step === 1 &&
                <Recovery_email
                    email={email}
                    onChangeEmail={(event) => {
                        setEmail(event.target.value);
                        cleanMessage();
                    }}
                    onSubmit={(value) => requestRecovery(value, true).then(() => undefined)}
                    submitting={submitting}
                />
            }
            {step === 2 &&
                <Recovery_code
                    code={code}
                    onChangeCode={setCode}
                    onSubmit={(value) => {
                        setCode(value);
                        cleanMessage();
                        setStep(3);
                    }}
                    onResend={() => requestRecovery(email, false)}
                    submitting={submitting}
                />
            }
            {step === 3 &&
                <Recovery_changePassword onSubmit={verifyRecovery} submitting={submitting}/>
            }
        </section>
    )
}

/** Formulario de inicio de sesión: valida los campos, llama al backend y limita los intentos fallidos. */
function SignInForm({ onForgotPassword }: { onForgotPassword: () => void }) {
    const { showMessage, cleanMessage } = useSysMessage();
    const { login } = useAuth();
    const navigate = useNavigate();
    const [ remainingAttempts, setRemainingAttempts ] = useState(3);
    // Evita un segundo envío mientras el primero sigue esperando respuesta. La ref corta al instante
    // (dos envíos en el mismo evento); el estado deshabilita el botón en pantalla.
    const submittingRef = useRef(false);
    const [ submitting, setSubmitting ] = useState(false);
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
            showMessage("Vuelve a intentar ingresar más tarde.", 'red', "Sin intentos")
            return;
        }


        if(form.email.length === 0 || form.password.length === 0){
            showMessage("Asegúrate de rellenar correctamente todos los campos solicitados.", {'type': 'inline','color': 'red', 'showTime': null, 'title':"Campos Faltantes"})
            return;
        }

        if(submittingRef.current) return;
        submittingRef.current = true;
        setSubmitting(true);
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
        }finally{
            submittingRef.current = false;
            setSubmitting(false);
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
                <label htmlFor="auth-email" className={inputsLabelsStyle}>Correo institucional</label>
                <input
                    id="auth-email"
                    type="text"
                    className={inputsStyle}
                    value={form.email}
                    onChange={handleChangeInput}
                    name={"email"}
                />
            </div>
            <div className={formsInputsDivsStyle}>
                <label htmlFor="auth-password" className={inputsLabelsStyle}>Contraseña</label>
                <input
                    id="auth-password"
                    type="password"
                    className={inputsStyle}
                    value={form.password}
                    onChange={handleChangeInput}
                    name={"password"}
                />
            </div>
            <div className="flex w-full flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-secondary">
                {/* shortcut: la sesión siempre se guarda en localStorage; habilitar cuando "recordar" decida dónde guardar el token. */}
                <label className="flex flex-1 cursor-not-allowed items-center gap-2 whitespace-nowrap opacity-60" title="Próximamente">
                    <input type="checkbox" disabled className="size-4.5 cursor-not-allowed accent-brand"/> Recordar este equipo
                </label>
                {/* Las cuentas web las gestiona un administrador; este enlace permite recuperar su contraseña. */}
                <button
                    type="button"
                    onClick={onForgotPassword}
                    className="text-right text-blue-600 hover:underline decoration-blue-600 underline-offset-3"
                >¿Olvidaste tu contraseña?</button>
            </div>
            <button
                type="submit"
                className={submitButtonStyle}
                disabled={remainingAttempts === 0 || submitting}
                aria-disabled={remainingAttempts === 0 || submitting}
            >{submitting ? 'Ingresando…' : 'Iniciar sesión'}</button>
            <div className="flex w-full items-center gap-4.75">
                <span className="h-px flex-1 bg-line-soft" />
                <span className="text-sm text-ink-muted">O</span>
                <span className="h-px flex-1 bg-line-soft" />
            </div>
            {/* El inicio de sesión con Google aún no está conectado. */}
            <button
                type="button"
                disabled
                title="Próximamente"
                className="
                    flex h-15 w-full items-center justify-center gap-3 rounded-[51px]
                    border border-line-soft bg-white px-7
                    text-base font-semibold text-ink
                    shadow-raised disabled:cursor-not-allowed
                "
            >
                <img src="/auth/google.svg" alt="" className="size-5.25" />
                Continuar con Google
            </button>
            <div className="flex w-full items-center gap-2.5 rounded-[14px] bg-subtle px-3.5 py-3">
                <LuShield className="size-4.5 shrink-0 text-ink-secondary" />
                <span className="text-caption text-ink-secondary">¿Eres ciudadano? Descarga la app Tijuana Reporta para reportar incidentes.</span>
            </div>
        </form>
    )
}

/** Página /auth del Figma: marca, formulario y métricas sobre la captura del mapa; en móvil se apilan en una columna. */
export default function AuthPage() {
    const {closePanel} = useCommonPanel();
    const {closeModal} = useModals();
    const {search} = useLocation();
    const navigate = useNavigate();
    const [form, setForm] = useState<"login" | "recovery">(
        () => new URLSearchParams(search).get("tab") === "recovery" ? "recovery" : "login",
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
                                <RecoveryPasswordForm
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
