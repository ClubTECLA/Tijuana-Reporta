import { useEffect, useRef, useState } from 'react'
import type { ClipboardEvent, FocusEvent, KeyboardEvent, MouseEvent, SubmitEvent } from 'react'
import {
    CODE_LENGTH,
    emptyCode,
    isCodeComplete,
    joinCode,
    normalizeDigits,
    setDigit,
    writeDigits,
} from '@/features/sesion/codeInput'
import { submitButtonStyle, subtitleStyle, titleStyle } from './authStyles'

const RESEND_SECONDS = 45
const CODE_INDEXES = Array.from({ length: CODE_LENGTH }, (_, index) => index)

interface RecoveryCodeFormProps {
    digits: string[]
    onChangeDigits: (digits: string[]) => void
    onSubmit: (pin: string) => void
    onResend: () => Promise<boolean>
    submitting: boolean
    /** El backend rechazó el código; se marca en rojo hasta que el usuario edite. */
    invalid?: boolean
}

export function RecoveryCodeForm({
    digits,
    onChangeDigits,
    onSubmit,
    onResend,
    submitting,
    invalid = false,
}: RecoveryCodeFormProps) {
    const [secondsRemaining, setSecondsRemaining] = useState(RESEND_SECONDS)
    const inputRefs = useRef<Array<HTMLInputElement | null>>([])
    const isComplete = isCodeComplete(digits)

    useEffect(() => {
        if (secondsRemaining === 0) return

        const timeout = window.setTimeout(() => {
            setSecondsRemaining((remaining) => Math.max(remaining - 1, 0))
        }, 1000)

        return () => window.clearTimeout(timeout)
    }, [secondsRemaining])

    // Enfoca un input y coloca el cursor al final del dígito, para poder borrarlo
    // de inmediato con Backspace.
    const focusInput = (index: number) => {
        const input = inputRefs.current[index]
        if (!input) return

        input.focus()
        input.setSelectionRange(input.value.length, input.value.length)
    }

    const handleChange = (index: number, value: string) => {
        // Autofill del sistema: llega el código completo en un solo input.
        if (normalizeDigits(value).length >= CODE_LENGTH) {
            onChangeDigits(writeDigits(digits, value))
            focusInput(CODE_LENGTH - 1)
            return
        }

        const next = setDigit(digits, index, value)
        onChangeDigits(next)

        if (next[index] && index < CODE_LENGTH - 1) {
            focusInput(index + 1)
        }
    }

    const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Backspace') {
            // Si el input tiene dígito, se deja que el navegador lo borre.
            if (digits[index]) return

            event.preventDefault()
            if (index > 0) {
                const next = [...digits]
                next[index - 1] = ''
                onChangeDigits(next)
                focusInput(index - 1)
            }
            return
        }

        if (event.key === 'ArrowLeft') {
            // Se evita la acción por defecto: movería el cursor al inicio del input anterior.
            event.preventDefault()
            focusInput(Math.max(index - 1, 0))
            return
        }

        if (event.key === 'ArrowRight') {
            event.preventDefault()
            const input = inputRefs.current[index]
            // Si el cursor está antes del dígito, primero se lleva al final para poder borrarlo.
            if (input && input.selectionStart !== null && input.selectionStart < input.value.length) {
                input.setSelectionRange(input.value.length, input.value.length)
                return
            }
            if (index < CODE_LENGTH - 1) focusInput(index + 1)
        }
    }

    const handlePaste = (event: ClipboardEvent<HTMLDivElement>) => {
        const pasted = normalizeDigits(event.clipboardData.getData('text'))
        if (!pasted) return

        event.preventDefault()
        onChangeDigits(writeDigits(digits, pasted))
        focusInput(Math.min(pasted.length, CODE_LENGTH - 1))
    }

    const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (isComplete) onSubmit(joinCode(digits))
    }

    const handleResend = async () => {
        if (await onResend()) {
            onChangeDigits(emptyCode())
            setSecondsRemaining(RESEND_SECONDS)
        }
    }

    const moveCaretToEnd = (input: HTMLInputElement) => {
        input.setSelectionRange(input.value.length, input.value.length)
    }

    return (
        <form
            className="w-full h-fit"
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
                {CODE_INDEXES.map((index) => (
                    <input
                        key={index}
                        ref={(element) => { inputRefs.current[index] = element; }}
                        aria-label={`Dígito ${index + 1} del código`}
                        aria-invalid={invalid || undefined}
                        autoComplete={index === 0 ? 'one-time-code' : 'off'}
                        autoFocus={index === 0}
                        inputMode="numeric"
                        disabled={submitting}
                        type="text"
                        value={digits[index] ?? ''}
                        onChange={(event) => handleChange(index, event.target.value)}
                        onFocus={(event: FocusEvent<HTMLInputElement>) => moveCaretToEnd(event.currentTarget)}
                        onClick={(event: MouseEvent<HTMLInputElement>) => moveCaretToEnd(event.currentTarget)}
                        onKeyDown={(event) => handleKeyDown(index, event)}
                        className={`
                            h-20 min-w-0 flex-1
                            rounded-2xl border
                            bg-white
                            text-center text-3xl
                            font-bold text-ink
                            caret-transparent
                            outline-none transition-colors
                            ${invalid
                                ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                                : 'border-line focus:border-blue-500 focus:ring-2 focus:ring-blue-100'}
                        `}
                    />
                ))}
            </div>
            <span className="text-sm text-gray-500 block mt-4">
                ¿No llegó? {secondsRemaining > 0
                    ? `Puedes reenviar en ${`${Math.floor(secondsRemaining / 60)}:${String(secondsRemaining % 60).padStart(2, '0')}`}.`
                    : 'Puedes solicitar un nuevo código.'}
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
                disabled={!isComplete || submitting}
            >
                Continuar
            </button>
        </form>
    )
}
