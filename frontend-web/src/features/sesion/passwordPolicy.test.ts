import { describe, expect, it } from 'vitest'
import { getPasswordRequirements, isPasswordValid, PASSWORD_MAX_BYTES } from './passwordPolicy'

describe('passwordPolicy', () => {
    it('acepta una contraseña que cumple todos los requisitos', () => {
        expect(isPasswordValid('Password-123!')).toBe(true)
    })

    it('rechaza una contraseña más corta que el mínimo', () => {
        expect(isPasswordValid('Pass-1!')).toBe(false)
    })

    it('rechaza una contraseña sin mayúscula', () => {
        expect(isPasswordValid('password-123!')).toBe(false)
    })

    it('rechaza una contraseña sin número', () => {
        expect(isPasswordValid('Password-abc!')).toBe(false)
    })

    it('rechaza una contraseña sin símbolo permitido', () => {
        expect(isPasswordValid('Password-123')).toBe(false)
    })

    it(`acepta hasta ${PASSWORD_MAX_BYTES} bytes y rechaza más`, () => {
        expect(isPasswordValid(`A1!${'a'.repeat(PASSWORD_MAX_BYTES - 3)}`)).toBe(true)
        expect(isPasswordValid(`A1!${'a'.repeat(PASSWORD_MAX_BYTES - 2)}`)).toBe(false)
    })

    it('expone cada requisito con su estado', () => {
        const requirements = getPasswordRequirements('Password-123!')

        expect(requirements).toHaveLength(3)
        expect(requirements.every(({ met }) => met)).toBe(true)
        expect(requirements.map(({ label }) => label)).toEqual([
            'Al menos 10 caracteres',
            'Una mayúscula y un número',
            'Un símbolo (!, #, $)',
        ])
    })
})
