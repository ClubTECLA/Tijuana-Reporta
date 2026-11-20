import { useRef, useState } from 'react'
import type { ChangeEvent, SubmitEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { LuShield } from 'react-icons/lu'
import { SysMessage, useSysMessage } from '@/components/ui/SysMessageContext'
import { useAuth } from '@/features/sesion/useAuth'
import {
    formsInputsDivsStyle,
    formsStyle,
    inputsLabelsStyle,
    inputsStyle,
    submitButtonStyle,
    subtitleStyle,
    titleStyle,
} from './authStyles'

// El contador es solo cosmético: el backend es quien limita los intentos.
const MAX_LOGIN_ATTEMPTS = 3

interface SignInFormProps {
    onForgotPassword: () => void
}

interface LoginErrorCopy {
    message: string
    title: string
}

/** Traduce los errores conocidos del login a copy propio, sin exponer detalles técnicos. */
function loginErrorCopy(error: unknown): LoginErrorCopy {
    const status = error instanceof Error && 'status' in error ? error.status : undefined

    if (status === 401) {
        return {
            message: 'El correo o la contraseña no son correctos.',
            title: 'Credenciales no válidas',
        }
    }
    if (status === 429) {
        return {
            message: 'Demasiados intentos. Espera un momento antes de volver a intentarlo.',
            title: 'Sin intentos',
        }
    }

    return {
        message: error instanceof Error && error.message
            ? error.message
            : 'No se pudo iniciar sesión. Inténtalo de nuevo.',
        title: 'Error al iniciar sesión',
    }
}

export function SignInForm({ onForgotPassword }: SignInFormProps) {
    const { showMessage, cleanMessage } = useSysMessage()
    const { login } = useAuth()
    const navigate = useNavigate()
    const [remainingAttempts, setRemainingAttempts] = useState(MAX_LOGIN_ATTEMPTS)
    // Evita un segundo envío mientras el primero sigue esperando respuesta. La ref corta al instante
    // (dos envíos en el mismo evento); el estado deshabilita el botón en pantalla.
    const submittingRef = useRef(false)
    const [submitting, setSubmitting] = useState(false)
    const [form, setForm] = useState({
        email: '',
        password: '',
    })

    const handleChangeInput = (event: ChangeEvent<HTMLInputElement>) => {
        if (remainingAttempts > 0) cleanMessage()
        const { name, value } = event.target
        setForm((current) => ({ ...current, [name]: value }))
    }

    const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
        event.preventDefault()

        if (remainingAttempts === 0) {
            showMessage('Vuelve a intentar ingresar más tarde.', 'red', 'Sin intentos')
            return
        }

        if (form.email.length === 0 || form.password.length === 0) {
            showMessage(
                'Asegúrate de rellenar correctamente todos los campos solicitados.',
                { type: 'inline', color: 'red', showTime: null, title: 'Campos Faltantes' },
            )
            return
        }

        if (submittingRef.current) return
        submittingRef.current = true
        setSubmitting(true)

        try {
            await login(form.email, form.password)
            navigate('/')
        } catch (error) {
            const status = error instanceof Error && 'status' in error ? error.status : undefined
            const invalidCredentials = status === 401
            const attemptsAfterFailure = invalidCredentials
                ? Math.max(remainingAttempts - 1, 0)
                : remainingAttempts
            const copy = loginErrorCopy(error)

            showMessage(
                copy.message,
                'red',
                invalidCredentials && attemptsAfterFailure === 0 ? 'Sin intentos' : copy.title,
            )
            setRemainingAttempts(attemptsAfterFailure)
        } finally {
            submittingRef.current = false
            setSubmitting(false)
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
                    type="email"
                    autoComplete="email"
                    className={inputsStyle}
                    value={form.email}
                    onChange={handleChangeInput}
                    name="email"
                    disabled={submitting}
                    required
                />
            </div>
            <div className={formsInputsDivsStyle}>
                <label htmlFor="auth-password" className={inputsLabelsStyle}>Contraseña</label>
                <input
                    id="auth-password"
                    type="password"
                    autoComplete="current-password"
                    className={inputsStyle}
                    value={form.password}
                    onChange={handleChangeInput}
                    name="password"
                    disabled={submitting}
                    required
                />
            </div>
            <div className="flex w-full flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-secondary">
                {/* shortcut: la sesión siempre se guarda en localStorage; habilitar cuando "recordar" decida dónde guardar el token. */}
                <label className="flex flex-1 cursor-not-allowed items-center gap-2 whitespace-nowrap opacity-60" title="Próximamente">
                    <input type="checkbox" disabled className="size-4.5 cursor-not-allowed accent-brand" /> Recordar este equipo
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
