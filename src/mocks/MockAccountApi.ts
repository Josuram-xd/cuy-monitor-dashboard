import type { AccountApi } from '../api/DashboardApi'
import type { User } from '../types/User'
import { MockResource } from './MockResource'

// after a reload the fake database is empty but the session survives: answer with a demo user
const DEMO_USER: User = {
  id: '00000000-0000-4000-8000-000000000000',
  username: 'demo',
  fullName: 'Usuario de prueba',
  email: 'demo@example.com',
  status: 'ACTIVE',
  createdAt: '2026-10-01T10:00:00Z',
  updatedAt: '2026-10-01T10:00:00Z',
}

export class MockAccountApi extends MockResource implements AccountApi {
  getMe(): Promise<User> {
    const user = this.db.users.find((u) => u.id === this.db.signedInUserId)
    return this.respond(user ?? DEMO_USER)
  }
}
