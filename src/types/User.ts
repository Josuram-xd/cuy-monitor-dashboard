export type UserStatus = 'PENDING_VERIFICATION' | 'ACTIVE' | 'DISABLED'

// GET /api/v1/users/me. The password hash never comes back.
export interface User {
  id: string
  username: string
  fullName: string
  email: string
  status: UserStatus
  createdAt: string
  updatedAt: string
}
