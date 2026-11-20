import { useState } from 'react'
import type { SubmitEvent } from 'react'
import { FiInfo } from 'react-icons/fi'
import { LuCircleCheckBig } from 'react-icons/lu'
import { getPasswordRequirements, isPasswordValid } from '@/features/sesion/passwordPolicy'
import {
    formsInputsDivsStyle,
    inputsLabelsStyle,
    inputsStyle,
    submitButtonStyle,
    subtitleStyle,
    titleStyle,
} from './authStyles'

interface RecoveryPasswordFormProps {
    onSubmit: (password: string) => Promise<void>
    submitting: boolean
}

export function RecoveryPasswordForm({ onSubmit, submitting }: RecoveryPasswordFormProps) {
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const requirements = getPasswordRequirements(password)
    const passwordValid = isPasswordValid(password)
    const passwordsMatch = password.length > 0 && password === confirmPassword

    const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (passwordValid && passwordsMatch) void onSubmit(password)
    }

    return (
        <form
            className="w-full h-fit"
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
                    autoFocus
                    aria-describedby="recovery-password-requirements"
                    className={inputsStyle}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={submitting}
                    required
                />
            </div>
            <ul
                id="recovery-password-requirements"
                className="mt-2 flex flex-col gap-1 text-sm"
                aria-label="Requisitos de contraseña"
            >
                {requirements.map(({ label, met }) => (
                    <li key={label} className={`flex items-center gap-2 ${met ? 'text-emerald-600' : 'text-ink-muted'}`}>
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
                            ? ''
                            : passwordsMatch
                                ? 'border-emerald-500'
                                : 'border-red-500'
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
                disabled={!passwordValid || !passwordsMatch || submitting}
            >
                {submitting ? 'Guardando…' : 'Actualizar contraseña'}
            </button>
        </form>
    )
}
