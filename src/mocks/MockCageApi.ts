import type { CageApi } from '../api/DashboardApi'
import type { CageHealth } from '../types/CageHealth'
import type { DateRange } from '../types/DateRange'
import { worstStatus } from '../types/HealthStatus'
import type { CageWeight } from '../types/WeightReading'
import { mockAudio } from './data'
import { MockResource } from './MockResource'

export class MockCageApi extends MockResource implements CageApi {
  getHealth(cageId: string): Promise<CageHealth> {
    if (!this.db.hasCage(cageId)) {
      return this.notFound()
    }
    const lastStable = this.db.weightReadings.filter((r) => r.stable).at(-1)
    const weight = {
      status: 'NORMAL' as const,
      lastGrams: lastStable?.grams ?? null,
      lastMeasuredAt: lastStable?.measuredAt ?? null,
    }
    const guineaPigs = this.db.guineaPigs.map(({ id, name, markColor, status }) => ({
      id,
      name,
      markColor,
      status,
    }))
    return this.respond({
      cageId,
      status: worstStatus([...guineaPigs.map((g) => g.status), mockAudio.status, weight.status]),
      guineaPigs,
      audio: mockAudio,
      weight,
      updatedAt: new Date().toISOString(),
    })
  }

  getWeight(cageId: string, range?: DateRange): Promise<CageWeight> {
    if (!this.db.hasCage(cageId)) {
      return this.notFound()
    }
    const { from, to } = this.resolveRange(range)
    return this.respond({
      cageId,
      readings: this.db.weightReadings.filter((r) => this.inRange(r.measuredAt, from, to)),
    })
  }
}
