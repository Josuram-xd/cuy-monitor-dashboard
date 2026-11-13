import type { Alert } from '../types/Alert'
import type { Cage } from '../types/Cage'
import type { GuineaPig } from '../types/GuineaPig'
import type { WeightReading } from '../types/WeightReading'
import {
  mockAlertHistory,
  mockAlerts,
  mockCageId,
  mockCages,
  mockGuineaPigs,
  mockSecondCageGuineaPigs,
  mockSecondCageId,
  mockWeightReadings,
} from './data'

export type MockUserStatus = 'PENDING_VERIFICATION' | 'ACTIVE' | 'DISABLED'

// what the fake backend stores about an account; the real one never sends most of it to the page
export interface MockUser {
  id: string
  username: string
  fullName: string
  email: string
  // only the fake backend keeps it, to check "current password" like the real one;
  // null for an account made with Google that never set one
  password: string | null
  status: MockUserStatus
  nickname?: string | null
  // the real backend keeps bytes and serves them at an address; the mock keeps the data: URL
  photoUrl?: string | null
}

// In-memory state shared by the mock APIs, so a guinea pig registered here
// also shows up in the cage health. Lives until the page reloads.
export class MockDatabase {
  readonly cageId = mockCageId
  readonly cages: Cage[] = structuredClone(mockCages)
  // the guinea pigs of the first cage; kept as its own array so tests can change it directly
  readonly guineaPigs: GuineaPig[] = structuredClone(mockGuineaPigs)
  // cage id -> its active guinea pigs
  readonly guineaPigsByCage: Record<string, GuineaPig[]> = {
    [mockCageId]: this.guineaPigs,
    [mockSecondCageId]: structuredClone(mockSecondCageGuineaPigs),
  }
  readonly alerts: Alert[] = [...structuredClone(mockAlerts), ...mockAlertHistory()]
  // only the pilot cage has a scale
  readonly weightReadings: WeightReading[] = mockWeightReadings()
  readonly users: MockUser[] = []
  // After a reload the fake database is empty but the fake session survives. This row stands in for
  // whoever is signed in, and being a row like any other, a nickname or a photo set on it sticks
  // for the rest of the session instead of being thrown away.
  readonly demoUser: MockUser = {
    id: 'demo',
    username: 'demo',
    fullName: 'Usuario de prueba',
    email: 'demo@cuymonitor.local',
    password: 'dev-password',
    status: 'ACTIVE',
  }
  // challengeId -> username of the pending code
  readonly challenges = new Map<string, { username: string; expiresAt: string }>()
  // last user that entered the code, answers "who am I" in the mocks
  signedInUserId: string | null = null

  hasCage(cageId: string): boolean {
    return this.cages.some((c) => c.cageId === cageId)
  }

  guineaPigsOf(cageId: string): GuineaPig[] {
    this.guineaPigsByCage[cageId] ??= []
    return this.guineaPigsByCage[cageId]
  }

  weightReadingsOf(cageId: string): WeightReading[] {
    return cageId === this.cageId ? this.weightReadings : []
  }

  allGuineaPigs(): GuineaPig[] {
    return Object.values(this.guineaPigsByCage).flat()
  }

  findGuineaPig(id: number): GuineaPig | undefined {
    return this.allGuineaPigs().find((g) => g.id === id)
  }

  findUser(username: string): MockUser | undefined {
    return this.users.find((u) => u.username === username)
  }

  nextGuineaPigId(): number {
    return Math.max(0, ...this.allGuineaPigs().map((g) => g.id)) + 1
  }
}
