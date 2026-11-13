import type { UserRole } from './Admin'

// GET /api/v1/account/profile. On purpose it carries only what the screens show:
// no id, email, status, timestamps or password hash.
export interface User {
  username: string
  fullName: string
  // the short name the breeder picked, null until they pick one
  nickname: string | null
  // the nickname, or the full name when there is none. The backend works it out so no screen has to
  displayName: string
  // false for an account made with Google that never set one: there is no password to ask for
  hasPassword: boolean
  // Where to point an <img>, or null for an account without a picture. The backend only answers
  // whether there is one (the bytes never travel inside the profile): the API adapter turns that
  // into an address, which is why this field is not in the contract.
  photoUrl: string | null
  // the session cookie is HttpOnly, so the page cannot read its token's claim: this is how it learns the role.
  // It decides what is drawn, never what is allowed
  role: UserRole
}
