import type { ChangeEvent, SubmitEvent } from 'react'
import { FaRegQuestionCircle } from 'react-icons/fa'
import { GoPaperAirplane } from 'react-icons/go'
import {
    formsInputsDivsStyle,
    inputsLabelsStyle,
    inputsStyle,
    submitButtonStyle,
    subtitleStyle,
    titleStyle,
} from './authStyles'

interface RecoveryEmailFormProps {
    email: string
    onChangeEmail: (event: ChangeEvent<HTMLInputElement>) => void
    onSubmit: (email: string) => Promise<void>
    submitting: boolean
}

export function RecoveryEmailForm({ email, onChangeEmail, onSubmit, submitting }: RecoveryEmailFormProps) {
    const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
        event.preventDefault()
        void onSubmit(email)
    }

    return (
        <form
            className="w-full h-fit"
            onSubmit={handleSubmit}
        >
            <h1 className={titleStyle}>Recupera tu contraseña</h1>
            <span className={subtitleStyle}>Escribe tu correo institucional. Te enviaremos un código a ese correo.</span>
            <div className={`${formsInputsDivsStyle} mt-4`}>
                <label htmlFor="recovery-email" className={inputsLabelsStyle}>Correo institucional</label>
                <input
                    id="recovery-email"
                    type="email"
                    className={inputsStyle}
                    autoComplete="email"
                    onChange={onChangeEmail}
                    value={email}
                    disabled={submitting}
                    required
                />
            </div>
            <button
                className={`${submitButtonStyle} mt-4 flex flex-row items-center justify-center gap-2`}
                type="submit"
                disabled={submitting}
            >
                <GoPaperAirplane className="-rotate-45 text-xl" />
                <span>{submitting ? 'Enviando…' : 'Enviar código'}</span>
            </button>
            <div className="flex w-full items-center gap-2.5 rounded-[14px] bg-subtle px-3.5 py-3 mt-4">
                <FaRegQuestionCircle className="size-4.5 shrink-0 text-ink-secondary" />
                <span className="text-caption text-ink-secondary">¿No tienes acceso a tu correo? Pide a un administrador que actualice tu cuenta.</span>
            </div>
        </form>
    )
}
