import type { Alert } from '../types/Alert'
import type { GuineaPig } from '../types/GuineaPig'
import type { WeightReading } from '../types/WeightReading'
import { mockAlerts, mockCageId, mockGuineaPigs, mockWeightReadings } from './data'

// In-memory state shared by the mock APIs, so a guinea pig registered here
// also shows up in the cage health. Lives until the page reloads.
export class MockDatabase {
  readonly cageId = mockCageId
  readonly guineaPigs: GuineaPig[] = structuredClone(mockGuineaPigs)
  readonly alerts: Alert[] = structuredClone(mockAlerts)
  readonly weightReadings: WeightReading[] = mockWeightReadings()

  hasCage(cageId: string): boolean {
    return cageId === this.cageId
  }

  findGuineaPig(id: number): GuineaPig | undefined {
    return this.guineaPigs.find((g) => g.id === id)
  }

  nextGuineaPigId(): number {
    return Math.max(0, ...this.guineaPigs.map((g) => g.id)) + 1
  }
}
