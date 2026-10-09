import type { AccountApi } from '../api/DashboardApi'
import type { User } from '../types/User'
import { mockSession } from './mockSession'
import { MockResource } from './MockResource'

// after a reload the fake database is empty but the fake session survives: answer with a demo user
const DEMO_USER: User = { username: 'demo', fullName: 'Usuario de prueba' }

export class MockAccountApi extends MockResource implements AccountApi {
  getProfile(): Promise<User> {
    const user = this.db.users.find((u) => u.id === this.db.signedInUserId)
    if (user) {
      return this.respond({ username: user.username, fullName: user.fullName })
    }
    // no cookie, no profile: the same 401 the backend gives
    return mockSession.has() ? this.respond(DEMO_USER) : this.fail(401, 'unauthorized')
  }
}
