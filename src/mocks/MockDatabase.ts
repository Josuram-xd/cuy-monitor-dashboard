import type { Alert } from '../types/Alert'
import type { GuineaPig } from '../types/GuineaPig'
import type { WeightReading } from '../types/WeightReading'
import { mockAlerts, mockCageId, mockGuineaPigs, mockWeightReadings } from './data'

export type MockUserStatus = 'PENDING_VERIFICATION' | 'ACTIVE' | 'DISABLED'

// what the fake backend stores about an account; the real one never sends most of it to the page
export interface MockUser {
  id: string
  username: string
  fullName: string
  email: string
  status: MockUserStatus
}

// In-memory state shared by the mock APIs, so a guinea pig registered here
// also shows up in the cage health. Lives until the page reloads.
export class MockDatabase {
  readonly cageId = mockCageId
  readonly guineaPigs: GuineaPig[] = structuredClone(mockGuineaPigs)
  readonly alerts: Alert[] = structuredClone(mockAlerts)
  readonly weightReadings: WeightReading[] = mockWeightReadings()
  readonly users: MockUser[] = []
  // challengeId -> username of the pending code
  readonly challenges = new Map<string, { username: string; expiresAt: string }>()
  // last user that entered the code, answers "who am I" in the mocks
  signedInUserId: string | null = null

  hasCage(cageId: string): boolean {
    return cageId === this.cageId
  }

  findGuineaPig(id: number): GuineaPig | undefined {
    return this.guineaPigs.find((g) => g.id === id)
  }

  findUser(username: string): MockUser | undefined {
    return this.users.find((u) => u.username === username)
  }

  nextGuineaPigId(): number {
    return Math.max(0, ...this.guineaPigs.map((g) => g.id)) + 1
  }
}
