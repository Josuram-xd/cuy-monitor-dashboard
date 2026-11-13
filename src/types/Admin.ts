// GET /api/v1/admin/*. Everything here needs an account with role ADMIN; the backend checks that against
// the database on every call, so hiding the screen is a courtesy, never the permission.

/** The kinds as the backend names them, which is not how the breeder's catalog is keyed. */
export type AdminCatalogKind = 'BREED' | 'COAT_COLOR' | 'MARK_COLOR'

export interface AdminCatalogOption {
  kind: AdminCatalogKind
  // upper case, A-Z 0-9 and _ only. It is the value stored on every guinea pig, so it never changes
  code: string
  // what the breeder reads in the pickers
  label: string
  // the dot's color for a MARK_COLOR, "#a1b2c3"; a breed has none
  hex: string | null
  sortOrder: number
  // false hides it from the pickers. The guinea pigs already using it keep it
  active: boolean
}

/** What the panel sends. `active` left out means true. */
export interface AdminCatalogOptionInput {
  kind: AdminCatalogKind
  code: string
  label: string
  hex?: string | null
  sortOrder: number
  active?: boolean
}

export type UserRole = 'BREEDER' | 'ADMIN'

export interface AdminUser {
  id: string
  username: string
  fullName: string
  email: string
  status: 'PENDING_VERIFICATION' | 'ACTIVE' | 'DISABLED'
  role: UserRole
  createdAt: string
}
