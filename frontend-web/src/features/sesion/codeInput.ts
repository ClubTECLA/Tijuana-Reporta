// Utilidades del código de recuperación de 6 dígitos. Se mantienen como arreglo
// posicional: un slot vacío nunca recorre a los demás.

export const CODE_LENGTH = 6

/** Código vacío con las seis posiciones reservadas. */
export function emptyCode(): string[] {
    return Array.from({ length: CODE_LENGTH }, () => "")
}

/** Copia el código a un arreglo de seis posiciones, rellenando los huecos con "". */
export function normalizeCode(code: readonly string[]): string[] {
    return Array.from({ length: CODE_LENGTH }, (_, index) => code[index] ?? "")
}

/** Deja solo dígitos. */
export function normalizeDigits(raw: string): string {
    return raw.replace(/\D/g, "")
}

/** El código solo se considera completo si las seis posiciones tienen un dígito. */
export function isCodeComplete(code: readonly string[]): boolean {
    return code.length === CODE_LENGTH && code.every((digit) => /^\d$/.test(digit))
}

/** Escribe un dígito en una posición sin mover ni colapsar las demás. */
export function setDigit(code: readonly string[], index: number, raw: string): string[] {
    const next = normalizeCode(code)
    if (index >= 0 && index < CODE_LENGTH) {
        next[index] = normalizeDigits(raw).slice(-1)
    }
    return next
}

/**
 * Reparte varios dígitos desde `startIndex` (paste o autofill del sistema).
 * Las posiciones que no reciben dígito conservan su valor.
 */
export function writeDigits(code: readonly string[], raw: string, startIndex = 0): string[] {
    const next = normalizeCode(code)
    const digits = normalizeDigits(raw)

    for (let offset = 0; offset < digits.length; offset += 1) {
        const index = startIndex + offset
        if (index >= CODE_LENGTH) break
        next[index] = digits[offset]
    }

    return next
}

/** Une las seis posiciones; solo debe usarse cuando `isCodeComplete` es true. */
export function joinCode(code: readonly string[]): string {
    return normalizeCode(code).join("")
}
