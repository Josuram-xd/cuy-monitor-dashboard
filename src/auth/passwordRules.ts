// The rules of a new password. They mirror the backend (PasswordPolicy), which is the one that decides:
// this file only lets the form tick a checklist while the user types, before anything is sent.

export const PASSWORD_MIN_LENGTH = 10
export const PASSWORD_MAX_LENGTH = 64
// BCrypt only reads 72 bytes: a longer password would be cut without a warning
export const PASSWORD_MAX_BYTES = 72

export type PasswordRule =
  | 'LENGTH'
  | 'LOWERCASE'
  | 'UPPERCASE'
  | 'DIGIT'
  | 'SPECIAL'
  | 'NO_SPACES'
  | 'NOT_COMMON'
  | 'NOT_PERSONAL'

// shown from the first keystroke, in this order
export const MAIN_RULES: readonly PasswordRule[] = [
  'LENGTH',
  'LOWERCASE',
  'UPPERCASE',
  'DIGIT',
  'SPECIAL',
]
// only worth showing once they are broken
export const WARNING_RULES: readonly PasswordRule[] = ['NO_SPACES', 'NOT_COMMON', 'NOT_PERSONAL']

// compared against the letters of the password only, so "Password123!" is caught too
const COMMON = new Set([
  'password',
  'contrasena',
  'contraseña',
  'qwerty',
  'qwertyuiop',
  'asdfgh',
  'admin',
  'administrator',
  'welcome',
  'letmein',
  'iloveyou',
  'monkey',
  'dragon',
  'abc',
  'monitor',
  'cuymonitor',
  'cuy',
  'cuyes',
  'guineapig',
  'secret',
  'changeme',
  'test',
  'usuario',
  'clave',
])
const MIN_IDENTITY_LENGTH = 3

export interface PasswordContext {
  username?: string
  email?: string
}

function mentions(lowerPassword: string, identity: string | undefined): boolean {
  if (!identity) {
    return false
  }
  // "ana.maria" is two names: either one inside the password is already too personal
  return identity
    .trim()
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .some((part) => part.length >= MIN_IDENTITY_LENGTH && lowerPassword.includes(part))
}

// the rules a password breaks, in a fixed order (empty = it is fine)
export function passwordProblems(raw: string, context: PasswordContext = {}): PasswordRule[] {
  const broken: PasswordRule[] = []
  const length = [...raw].length
  const bytes = new TextEncoder().encode(raw).length
  if (length < PASSWORD_MIN_LENGTH || length > PASSWORD_MAX_LENGTH || bytes > PASSWORD_MAX_BYTES) {
    broken.push('LENGTH')
  }
  if (!/\p{Ll}/u.test(raw)) {
    broken.push('LOWERCASE')
  }
  if (!/\p{Lu}/u.test(raw)) {
    broken.push('UPPERCASE')
  }
  if (!/\p{Nd}/u.test(raw)) {
    broken.push('DIGIT')
  }
  // a symbol or punctuation mark: not a letter, not a digit, not a space
  if (!/[^\p{L}\p{N}\s]/u.test(raw)) {
    broken.push('SPECIAL')
  }
  if (/\s/u.test(raw)) {
    broken.push('NO_SPACES')
  }
  const lower = raw.toLowerCase()
  if (COMMON.has(lower.replace(/[^\p{L}]/gu, ''))) {
    broken.push('NOT_COMMON')
  }
  if (mentions(lower, context.username) || mentions(lower, context.email?.split('@')[0])) {
    broken.push('NOT_PERSONAL')
  }
  return broken
}

// the backend sends its own codes (MIN_LENGTH / MAX_LENGTH): the form shows them as one rule
export function fromServerCodes(codes: string): PasswordRule[] {
  const known: Record<string, PasswordRule> = {
    MIN_LENGTH: 'LENGTH',
    MAX_LENGTH: 'LENGTH',
    LOWERCASE: 'LOWERCASE',
    UPPERCASE: 'UPPERCASE',
    DIGIT: 'DIGIT',
    SPECIAL: 'SPECIAL',
    NO_SPACES: 'NO_SPACES',
    NOT_COMMON: 'NOT_COMMON',
    NOT_PERSONAL: 'NOT_PERSONAL',
  }
  const rules = codes
    .split(',')
    .map((code) => known[code.trim()])
    .filter((rule): rule is PasswordRule => rule !== undefined)
  return [...new Set(rules)]
}
