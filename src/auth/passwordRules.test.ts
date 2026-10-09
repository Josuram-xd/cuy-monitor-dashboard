import { describe, expect, it } from 'vitest'
import { fromServerCodes, passwordProblems } from './passwordRules'

const ctx = { username: 'juan', email: 'juan@mail.com' }

describe('passwordProblems', () => {
  it.each(['Cuyes-felices-9', 'Zx9$kLm2pQ', 'Ñandú#Rápido7', 'Aa1!aaaaaa', 'Cuyes_felices1'])(
    'accepts %s',
    (password) => {
      expect(passwordProblems(password, ctx)).toEqual([])
    },
  )

  it('wants 10 to 64 characters', () => {
    expect(passwordProblems('Aa1!aaaaa', ctx)).toEqual(['LENGTH'])
    expect(passwordProblems('Aa1!' + 'a'.repeat(60), ctx)).toEqual([])
    expect(passwordProblems('Aa1!' + 'a'.repeat(61), ctx)).toEqual(['LENGTH'])
  })

  it('counts bytes too, because BCrypt cuts after 72', () => {
    // 40 characters but each "ñ" is 2 bytes: 82 bytes
    expect(passwordProblems('Aa1!' + 'ñ'.repeat(36), ctx)).toEqual(['LENGTH'])
  })

  it('needs a lowercase, an uppercase, a digit and a special character', () => {
    expect(passwordProblems('ALLUPPER-123456', ctx)).toEqual(['LOWERCASE'])
    expect(passwordProblems('alllower-123456', ctx)).toEqual(['UPPERCASE'])
    expect(passwordProblems('NoDigitsHere-aaa', ctx)).toEqual(['DIGIT'])
    expect(passwordProblems('NoSpecial12345aa', ctx)).toEqual(['SPECIAL'])
  })

  it('does not take a letter with an accent for a special character', () => {
    expect(passwordProblems('Cuyés felices1', ctx)).toContain('SPECIAL')
  })

  it('refuses spaces', () => {
    expect(passwordProblems('Cuyes felices-9', ctx)).toEqual(['NO_SPACES'])
  })

  it.each(['Password123!', 'PASSWORD-2026', 'Qwerty_12345', 'Contraseña#2026', 'Admin-123456'])(
    'refuses the well-known password %s even decorated',
    (password) => {
      expect(passwordProblems(password, ctx)).toContain('NOT_COMMON')
    },
  )

  it('refuses a password made of the username or a part of the email', () => {
    expect(passwordProblems('Mi-Juan-2026!!', { username: 'juan' })).toEqual(['NOT_PERSONAL'])
    expect(
      passwordProblems('Ana#Maria-2026', { username: 'pedro', email: 'ana.maria@mail.com' }),
    ).toContain('NOT_PERSONAL')
    // a very short name would match almost anything
    expect(passwordProblems('Algo-largo-12', { username: 'al', email: 'al@mail.com' })).toEqual([])
  })

  it('reports every broken rule at once, in a fixed order', () => {
    expect(passwordProblems('xyz', ctx)).toEqual(['LENGTH', 'UPPERCASE', 'DIGIT', 'SPECIAL'])
  })
})

describe('fromServerCodes', () => {
  it('turns the backend codes into the rules of the form', () => {
    expect(fromServerCodes('MIN_LENGTH,SPECIAL')).toEqual(['LENGTH', 'SPECIAL'])
  })

  it('shows min and max length as one rule, ignores unknown codes and repeats', () => {
    expect(fromServerCodes('MIN_LENGTH,MAX_LENGTH,WHATEVER,DIGIT,DIGIT')).toEqual([
      'LENGTH',
      'DIGIT',
    ])
  })
})
