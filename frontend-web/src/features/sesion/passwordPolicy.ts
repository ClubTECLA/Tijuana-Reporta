// Política de contraseña nueva. El backend valida la misma regla al verificar
// la recuperación, para que no se pueda evadir llamando directo a la API.

export const PASSWORD_MIN_LENGTH = 10
export const PASSWORD_MAX_BYTES = 72

export interface PasswordRequirement {
    label: string
    met: boolean
}

export function getPasswordRequirements(password: string): PasswordRequirement[] {
    return [
        {
            label: `Al menos ${PASSWORD_MIN_LENGTH} caracteres`,
            met: password.length >= PASSWORD_MIN_LENGTH,
        },
        {
            label: "Una mayúscula y un número",
            met: /[A-Z]/.test(password) && /\d/.test(password),
        },
        {
            label: "Un símbolo (!, #, $)",
            met: /[!#$]/.test(password),
        },
        {
            label: `Máximo ${PASSWORD_MAX_BYTES} bytes`,
            met: new TextEncoder().encode(password).length <= PASSWORD_MAX_BYTES,
        },
    ]
}

export function isPasswordValid(password: string): boolean {
    return getPasswordRequirements(password).every(({ met }) => met)
}
