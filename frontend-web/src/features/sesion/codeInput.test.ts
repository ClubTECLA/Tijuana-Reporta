import { describe, expect, it } from 'vitest'
import {
    CODE_LENGTH,
    emptyCode,
    isCodeComplete,
    joinCode,
    normalizeCode,
    normalizeDigits,
    setDigit,
    writeDigits,
} from './codeInput'

describe('codeInput', () => {
    it('emptyCode reserva las seis posiciones', () => {
        expect(emptyCode()).toEqual(['', '', '', '', '', ''])
        expect(emptyCode()).toHaveLength(CODE_LENGTH)
    })

    it('setDigit no colapsa los huecos al editar una posición intermedia', () => {
        const withFirst = setDigit(emptyCode(), 0, '1')
        const withThird = setDigit(withFirst, 2, '3')

        expect(withThird).toEqual(['1', '', '3', '', '', ''])
    })

    it('setDigit reemplaza el dígito de la posición y conserva el resto', () => {
        const code = ['1', '2', '3', '4', '5', '6']

        expect(setDigit(code, 1, '9')).toEqual(['1', '9', '3', '4', '5', '6'])
    })

    it('setDigit toma el último dígito cuando el input trae más de uno', () => {
        expect(setDigit(emptyCode(), 0, '12')).toEqual(['2', '', '', '', '', ''])
    })

    it('setDigit borra la posición cuando no hay dígitos', () => {
        const code = ['1', '2', '3', '4', '5', '6']

        expect(setDigit(code, 2, '')).toEqual(['1', '2', '', '4', '5', '6'])
    })

    it('writeDigits reparte un código pegado desde el inicio', () => {
        expect(writeDigits(emptyCode(), '123456')).toEqual(['1', '2', '3', '4', '5', '6'])
    })

    it('writeDigits ignora lo que no son dígitos y no pasa de seis posiciones', () => {
        expect(writeDigits(emptyCode(), '12-34-56-78')).toEqual(['1', '2', '3', '4', '5', '6'])
    })

    it('writeDigits respeta las posiciones que no reciben dígitos', () => {
        const code = ['9', '', '', '', '', '']

        expect(writeDigits(code, '123')).toEqual(['1', '2', '3', '', '', ''])
    })

    it('writeDigits escribe desde la posición indicada al pegar un fragmento', () => {
        const code = ['1', '2', '3', '4', '5', '6']

        expect(writeDigits(code, '99', 2)).toEqual(['1', '2', '9', '9', '5', '6'])
    })

    it('isCodeComplete exige las seis posiciones con dígito', () => {
        expect(isCodeComplete(['1', '2', '3', '4', '5', '6'])).toBe(true)
        expect(isCodeComplete(['1', '2', '3', '4', '5', ''])).toBe(false)
        expect(isCodeComplete(['1', '2', '3', '4', '5'])).toBe(false)
    })

    it('joinCode une las seis posiciones', () => {
        expect(joinCode(['1', '2', '3', '4', '5', '6'])).toBe('123456')
    })

    it('normalizeCode rellena hasta seis posiciones sin mutar el original', () => {
        const original = ['1', '2']
        const normalized = normalizeCode(original)

        expect(normalized).toEqual(['1', '2', '', '', '', ''])
        expect(original).toEqual(['1', '2'])
    })

    it('normalizeDigits descarta todo lo que no sea dígito', () => {
        expect(normalizeDigits(' 1a2-3 ')).toBe('123')
    })
})
