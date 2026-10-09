// GET /api/v1/account/profile. On purpose it carries only what the screens show:
// no id, email, status, timestamps or password hash.
export interface User {
  username: string
  fullName: string
  // false for an account made with Google that never set one: there is no password to ask for
  hasPassword: boolean
}
