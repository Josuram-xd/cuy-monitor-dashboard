// GET /api/v1/account/profile. On purpose it carries only what the screens show:
// no id, email, status, timestamps or password hash.
export interface User {
  username: string
  fullName: string
}
