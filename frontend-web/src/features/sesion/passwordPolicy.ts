// Política de contraseña nueva del frontend: mínimo 10 caracteres, mayúscula,
// número y símbolo. El límite de 72 bytes (bcrypt) también se valida aquí, pero
// no se muestra en la lista de requisitos. El backend no aplica las reglas de
// mayúscula/número/símbolo: solo exige 8 caracteres mínimo y 72 bytes máximo.

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
    ]
}

export function isPasswordValid(password: string): boolean {
    return new TextEncoder().encode(password).length <= PASSWORD_MAX_BYTES
        && getPasswordRequirements(password).every(({ met }) => met)
}
