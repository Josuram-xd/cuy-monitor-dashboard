import type { AdminCatalogKind } from '../../types/Admin'

/**
 * The code is what every guinea pig stores, so it can only hold A-Z, 0-9 and _ (up to 20 characters), the same
 * rule as `ck_catalog_option_code` in the database. Nobody should have to type that: it is derived from the
 * label — "Cuy colombiano" becomes "CUY_COLOMBIANO" — and the admin can still correct it by hand.
 */
export const MAX_CODE_LENGTH = 20

export function codeFromLabel(label: string): string {
  return (
    label
      .normalize('NFD')
      // strip the accents, so "Canela café" does not become "CANELA_CAF"
      .replace(/[̀-ͯ]/g, '')
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, MAX_CODE_LENGTH)
      // a trailing _ left by the cut reads like a mistake
      .replace(/_+$/, '')
  )
}

export function isValidCode(code: string): boolean {
  return code.length > 0 && code.length <= MAX_CODE_LENGTH && /^[A-Z0-9_]+$/.test(code)
}

/** Only a mark color is drawn as a dot, so only it needs a color. */
export function needsHex(kind: AdminCatalogKind): boolean {
  return kind === 'MARK_COLOR'
}

export function isValidHex(hex: string): boolean {
  return /^#[0-9a-f]{6}$/.test(hex)
}
