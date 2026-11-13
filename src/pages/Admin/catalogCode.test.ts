import { describe, expect, it } from 'vitest'
import { codeFromLabel, isValidCode, isValidHex, MAX_CODE_LENGTH } from './catalogCode'

describe('codeFromLabel', () => {
  it('turns what the admin types into a code the database accepts', () => {
    expect(codeFromLabel('Cuy colombiano')).toBe('CUY_COLOMBIANO')
  })

  it('drops the accents instead of the letters', () => {
    expect(codeFromLabel('Canela café')).toBe('CANELA_CAFE')
  })

  it('leaves no _ at either end', () => {
    expect(codeFromLabel('  ¡Raza nueva!  ')).toBe('RAZA_NUEVA')
  })

  it('cuts at the length the column allows, without a trailing _', () => {
    const code = codeFromLabel('Raza peruana mejorada de altura')
    expect(code.length).toBeLessThanOrEqual(MAX_CODE_LENGTH)
    expect(code.endsWith('_')).toBe(false)
    expect(isValidCode(code)).toBe(true)
  })

  it('has nothing to derive from a label with no letters', () => {
    expect(codeFromLabel('¿¡!?')).toBe('')
    expect(isValidCode('')).toBe(false)
  })

  it('every code it derives is one the backend takes', () => {
    for (const label of ['Americano', 'Negro y blanco', 'Tricolor 3', 'Ábaco']) {
      expect(isValidCode(codeFromLabel(label))).toBe(true)
    }
  })
})

describe('isValidHex', () => {
  it('takes the form the backend asks for', () => {
    expect(isValidHex('#a1b2c3')).toBe(true)
  })

  it('refuses upper case and the short form, which the backend rejects', () => {
    expect(isValidHex('#A1B2C3')).toBe(false)
    expect(isValidHex('#abc')).toBe(false)
    expect(isValidHex('red')).toBe(false)
  })
})
