import type { CageApi } from '../api/DashboardApi'
import type { Cage, CageInput } from '../types/Cage'
import { MAX_CAGE_LOCATION_LENGTH, MAX_CAGE_NAME_LENGTH } from '../types/Cage'
import type { CageHealth } from '../types/CageHealth'
import type { DateRange } from '../types/DateRange'
import { worstStatus } from '../types/HealthStatus'
import type { CageWeight } from '../types/WeightReading'
import { mockAudio } from './data'
import { MockResource } from './MockResource'

export class MockCageApi extends MockResource implements CageApi {
  list(): Promise<Cage[]> {
    return this.respond(this.db.cages)
  }

  get(cageId: string): Promise<Cage> {
    const cage = this.db.cages.find((c) => c.cageId === cageId)
    return cage ? this.respond(cage) : this.notFound()
  }

  create(body: CageInput): Promise<Cage> {
    const fields = this.validate(body)
    if (!fields) {
      return this.fail(400, 'bad_request')
    }
    const created: Cage = {
      // like the backend: "cage-" and 8 hex characters
      cageId: `cage-${Math.floor(Math.random() * 0xffffffff)
        .toString(16)
        .padStart(8, '0')}`,
      ...fields,
      createdAt: new Date().toISOString(),
    }
    this.db.cages.push(created)
    return this.respond(created)
  }

  update(cageId: string, body: CageInput): Promise<Cage> {
    const cage = this.db.cages.find((c) => c.cageId === cageId)
    if (!cage) {
      return this.notFound()
    }
    const fields = this.validate(body)
    if (!fields) {
      return this.fail(400, 'bad_request')
    }
    Object.assign(cage, fields)
    return this.respond(cage)
  }

  remove(cageId: string): Promise<void> {
    const index = this.db.cages.findIndex((c) => c.cageId === cageId)
    if (index === -1) {
      return this.notFound()
    }
    // soft delete in the backend: the cage leaves the list, its alerts stay in the database
    this.db.cages.splice(index, 1)
    return this.respond(undefined)
  }

  getHealth(cageId: string): Promise<CageHealth> {
    if (!this.db.hasCage(cageId)) {
      return this.notFound()
    }
    const lastStable = this.db
      .weightReadingsOf(cageId)
      .filter((r) => r.stable)
      .at(-1)
    const weight = {
      status: 'NORMAL' as const,
      lastGrams: lastStable?.grams ?? null,
      lastMeasuredAt: lastStable?.measuredAt ?? null,
    }
    const guineaPigs = this.db.guineaPigsOf(cageId).map(({ id, name, markColor, status }) => ({
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
      readings: this.db
        .weightReadingsOf(cageId)
        .filter((r) => this.inRange(r.measuredAt, from, to)),
    })
  }

  // the same rules as the backend: trimmed name of 1 to 100, optional location up to 200
  private validate(body: CageInput): { name: string; location: string | null } | undefined {
    const name = body.name.trim()
    const location = body.location?.trim() || null
    if (name.length === 0 || name.length > MAX_CAGE_NAME_LENGTH) {
      return undefined
    }
    if (location !== null && location.length > MAX_CAGE_LOCATION_LENGTH) {
      return undefined
    }
    return { name, location }
  }
}
