import type { AccountApi } from '../api/DashboardApi'
import type {
  ChangePasswordRequest,
  DeactivateAccountRequest,
  UpdateProfileRequest,
} from '../types/Account'
import type { User } from '../types/User'
import type { MockUser } from './MockDatabase'
import { mockSession } from './mockSession'
import { MockResource } from './MockResource'

// after a reload the fake database is empty but the fake session survives: answer with a demo user
const DEMO_USER: User = { username: 'demo', fullName: 'Usuario de prueba' }
const MIN_PASSWORD_BYTES = 8
const MAX_PASSWORD_BYTES = 72

export class MockAccountApi extends MockResource implements AccountApi {
  getProfile(): Promise<User> {
    const user = this.currentUser()
    if (user) {
      return this.respond({ username: user.username, fullName: user.fullName })
    }
    // no cookie, no profile: the same 401 the backend gives
    return mockSession.has() ? this.respond(DEMO_USER) : this.fail(401, 'unauthorized')
  }

  updateProfile(body: UpdateProfileRequest): Promise<User> {
    const fullName = body.fullName.trim()
    if (!fullName || fullName.length > 150) {
      return this.fail(400, 'bad_request', { fullName: 'invalid' })
    }
    const user = this.currentUser()
    if (user) {
      user.fullName = fullName
      return this.respond({ username: user.username, fullName })
    }
    return mockSession.has()
      ? this.respond({ ...DEMO_USER, fullName })
      : this.fail(401, 'unauthorized')
  }

  changePassword(body: ChangePasswordRequest): Promise<void> {
    const user = this.currentUser()
    if (!user && !mockSession.has()) {
      return this.fail(401, 'unauthorized')
    }
    if (user && user.password !== body.currentPassword) {
      return this.fail(401, 'unauthorized')
    }
    const bytes = new TextEncoder().encode(body.newPassword).length
    if (bytes < MIN_PASSWORD_BYTES || bytes > MAX_PASSWORD_BYTES) {
      return this.fail(400, 'bad_request', { newPassword: 'size must be between 8 and 72' })
    }
    if (user) {
      user.password = body.newPassword
    }
    return this.respond(undefined)
  }

  deactivate(body: DeactivateAccountRequest): Promise<void> {
    const user = this.currentUser()
    if (user && user.password !== body.currentPassword) {
      return this.fail(401, 'unauthorized')
    }
    if (user) {
      user.status = 'DISABLED'
    }
    this.db.signedInUserId = null
    mockSession.end()
    return this.respond(undefined)
  }

  private currentUser(): MockUser | undefined {
    return this.db.users.find((u) => u.id === this.db.signedInUserId)
  }
}
