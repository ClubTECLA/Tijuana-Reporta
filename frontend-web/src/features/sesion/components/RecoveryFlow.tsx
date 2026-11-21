import { useEffect, useRef, useState } from 'react'
import { FiLock, FiMail } from 'react-icons/fi'
import { IoChevronBack } from 'react-icons/io5'
import { LuCircleCheckBig } from 'react-icons/lu'
import { SysMessage, useSysMessage } from '@/components/ui/SysMessageContext'
import { emptyCode } from '@/features/sesion/codeInput'
import { solicitarRecuperacion, verificarRecuperacion } from '@/features/sesion/recovery.service'
import { formsStyle } from './authStyles'
import { RecoveryCodeForm } from './RecoveryCodeForm'
import { RecoveryEmailForm } from './RecoveryEmailForm'
import { RecoveryPasswordForm } from './RecoveryPasswordForm'

type RecoveryStep = 'email' | 'code' | 'password'

const BACK_LABEL: Record<Exclude<RecoveryStep, 'email'>, string> = {
    code: 'Cambiar correo',
    password: 'Cambiar código',
}

const backButtonStyle = `
    flex flex-row items-center justify-start gap-2 text-sm
    text-blue-600 font-bold hover:bg-blue-100 transition-all duration-300
    rounded-lg pr-2 py-2
    disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent
`

interface RecoveryFlowProps {
    onBackToLogin: () => void
    onComplete: () => void
}

export function RecoveryFlow({ onBackToLogin, onComplete }: RecoveryFlowProps) {
    const { showMessage, cleanMessage } = useSysMessage()
    const [step, setStep] = useState<RecoveryStep>('email')
    const [email, setEmail] = useState('')
    const [codeDigits, setCodeDigits] = useState<string[]>(emptyCode)
    const [pin, setPin] = useState('')
    const [codeInvalid, setCodeInvalid] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const submittingRef = useRef(false)
    const mountedRef = useRef(true)
    const requestIdRef = useRef(0)

    useEffect(() => {
        mountedRef.current = true
        return () => {
            mountedRef.current = false
            // Invalida cualquier petición en vuelo al abandonar el formulario.
            requestIdRef.current += 1
        }
    }, [])

    const beginRequest = () => ++requestIdRef.current
    const isCurrentRequest = (requestId: number) =>
        mountedRef.current && requestIdRef.current === requestId

    const requestRecovery = async (targetEmail: string, advanceToCode: boolean) => {
        if (submittingRef.current) return false
        submittingRef.current = true
        setSubmitting(true)
        cleanMessage()
        const requestId = beginRequest()

        try {
            await solicitarRecuperacion({ email: targetEmail })
            if (!isCurrentRequest(requestId)) return false

            if (advanceToCode) {
                setEmail(targetEmail)
                setPin('')
                setCodeDigits(emptyCode())
                setCodeInvalid(false)
                setStep('code')
            }
            showMessage(
                'Si hay una cuenta que pueda recuperarse con ese correo, recibirás un código. Revisa también la carpeta de spam.',
                { color: 'blue', type: 'inline', showTime: null, title: 'Solicitud recibida' },
            )
            return true
        } catch (error) {
            if (!isCurrentRequest(requestId)) return false

            const status = error instanceof Error && 'status' in error ? error.status : undefined
            showMessage(
                status === 429
                    ? 'Se realizaron demasiadas solicitudes. Espera un momento antes de volver a intentarlo.'
                    : error instanceof Error
                        ? error.message
                        : 'No se pudo solicitar el código. Inténtalo de nuevo.',
                { color: 'red', type: 'inline', showTime: null, title: 'No se pudo enviar el código' },
            )
            return false
        } finally {
            submittingRef.current = false
            if (isCurrentRequest(requestId)) setSubmitting(false)
        }
    }

    const verifyRecovery = async (newPassword: string) => {
        if (submittingRef.current) return
        submittingRef.current = true
        setSubmitting(true)
        cleanMessage()
        const requestId = beginRequest()

        try {
            await verificarRecuperacion({ email, pin, new_password: newPassword })
            if (!isCurrentRequest(requestId)) return

            showMessage(
                'Tu contraseña se actualizó correctamente. Ya puedes iniciar sesión.',
                { color: 'green', type: 'inline', showTime: null, title: 'Contraseña actualizada' },
            )
            onComplete()
        } catch (error) {
            if (!isCurrentRequest(requestId)) return

            const status = error instanceof Error && 'status' in error ? error.status : undefined
            if (status === 400) {
                // El código no sirve: volver al paso del código conservando los dígitos.
                setCodeInvalid(true)
                setStep('code')
                showMessage(
                    'El código es inválido o expiró. Revisa los seis dígitos o solicita uno nuevo.',
                    { color: 'red', type: 'inline', showTime: null, title: 'No se pudo actualizar la contraseña' },
                )
            } else if (status === 429) {
                showMessage(
                    'Se realizaron demasiados intentos. Espera un momento antes de volver a intentarlo.',
                    { color: 'red', type: 'inline', showTime: null, title: 'No se pudo actualizar la contraseña' },
                )
            } else {
                showMessage(
                    error instanceof Error
                        ? error.message
                        : 'No se pudo actualizar la contraseña. Inténtalo de nuevo.',
                    { color: 'red', type: 'inline', showTime: null, title: 'No se pudo actualizar la contraseña' },
                )
            }
        } finally {
            submittingRef.current = false
            if (isCurrentRequest(requestId)) setSubmitting(false)
        }
    }

    const goBack = () => {
        cleanMessage()
        setCodeInvalid(false)
        setStep(step === 'password' ? 'code' : 'email')
    }

    return (
        <section className={formsStyle}>
            {step !== 'email' ? (
                <button
                    type="button"
                    disabled={submitting}
                    className={backButtonStyle}
                    onClick={goBack}
                >
                    <IoChevronBack />
                    {BACK_LABEL[step]}
                </button>
            ) : (
                <button
                    type="button"
                    className={backButtonStyle}
                    onClick={() => {
                        cleanMessage()
                        onBackToLogin()
                    }}
                >
                    <IoChevronBack />
                    Volver a iniciar sesión
                </button>
            )}
            {step !== 'password' ? (
                <div className="
                        flex items-center justify-center rounded-xl bg-blue-100
                        p-3 text-blue-600 text-2xl
                    "
                >
                    {step === 'email' ? <FiLock /> : <FiMail />}
                </div>
            ) : (
                <div className="
                        flex items-center justify-center rounded-xl bg-green-100
                        p-3 text-green-600 text-2xl
                    "
                >
                    <LuCircleCheckBig />
                </div>
            )}
            <SysMessage />
            {step === 'email' && (
                <RecoveryEmailForm
                    email={email}
                    onChangeEmail={(event) => {
                        setEmail(event.target.value)
                        cleanMessage()
                    }}
                    onSubmit={(value) => requestRecovery(value, true).then(() => undefined)}
                    submitting={submitting}
                />
            )}
            {step === 'code' && (
                <RecoveryCodeForm
                    digits={codeDigits}
                    onChangeDigits={(next) => {
                        setCodeDigits(next)
                        setCodeInvalid(false)
                    }}
                    onSubmit={(value) => {
                        setPin(value)
                        cleanMessage()
                        setStep('password')
                    }}
                    onResend={() => requestRecovery(email, false)}
                    submitting={submitting}
                    invalid={codeInvalid}
                />
            )}
            {step === 'password' && (
                <RecoveryPasswordForm onSubmit={verifyRecovery} submitting={submitting} />
            )}
        </section>
    )
}
