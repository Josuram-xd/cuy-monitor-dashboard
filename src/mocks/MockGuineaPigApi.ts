import type { GuineaPigApi } from '../api/DashboardApi'
import type { DateRange } from '../types/DateRange'
import type { GuineaPig, GuineaPigHistory, NewGuineaPig } from '../types/GuineaPig'
import { MAX_NOTES_LENGTH, MAX_WEIGHT_GRAMS, MIN_WEIGHT_GRAMS } from '../types/GuineaPigProfile'
import { mockTransitions, mockWindows } from './data'
import { MockResource } from './MockResource'

const MAX_NAME_LENGTH = 100

export class MockGuineaPigApi extends MockResource implements GuineaPigApi {
  list(cageId: string): Promise<GuineaPig[]> {
    if (!this.db.hasCage(cageId)) {
      return this.notFound()
    }
    return this.respond(this.db.guineaPigs)
  }

  register(cageId: string, body: NewGuineaPig): Promise<GuineaPig> {
    if (!this.db.hasCage(cageId)) {
      return this.notFound()
    }
    const name = body.name.trim()
    if (name.length === 0 || name.length > MAX_NAME_LENGTH) {
      return this.fail(400, 'bad_request')
    }
    // the same limits as the backend
    const weight = body.initialWeightGrams
    if (
      weight !== undefined &&
      (!Number.isInteger(weight) || weight < MIN_WEIGHT_GRAMS || weight > MAX_WEIGHT_GRAMS)
    ) {
      return this.fail(400, 'bad_request', { initialWeightGrams: 'invalid' })
    }
    const notes = body.notes?.trim()
    if (notes !== undefined && notes.length > MAX_NOTES_LENGTH) {
      return this.fail(400, 'bad_request', { notes: 'invalid' })
    }
    if (this.db.guineaPigs.some((g) => g.markColor === body.markColor)) {
      return this.fail(409, 'conflict')
    }
    const created: GuineaPig = {
      id: this.db.nextGuineaPigId(),
      name,
      markColor: body.markColor,
      status: 'NORMAL',
      statusSince: new Date().toISOString(),
      breed: body.breed ?? null,
      coatColor: body.coatColor ?? null,
      initialWeightGrams: weight ?? null,
      notes: notes || null,
    }
    this.db.guineaPigs.push(created)
    return this.respond(created)
  }

  remove(cageId: string, id: number): Promise<void> {
    if (!this.db.hasCage(cageId)) {
      return this.notFound()
    }
    const index = this.db.guineaPigs.findIndex((g) => g.id === id)
    if (index === -1) {
      return this.notFound()
    }
    // like the backend, the cuy leaves the list (and frees its color); the alerts it had stay
    this.db.guineaPigs.splice(index, 1)
    return this.respond(undefined)
  }

  getHistory(id: number, range?: DateRange): Promise<GuineaPigHistory> {
    if (!this.db.findGuineaPig(id)) {
      return this.notFound()
    }
    const { from, to } = this.resolveRange(range)
    if (Date.parse(to) <= Date.parse(from)) {
      return this.fail(400, 'bad_request')
    }
    return this.respond({
      guineaPigId: id,
      from,
      to,
      transitions: (mockTransitions[id] ?? []).filter((t) => this.inRange(t.occurredAt, from, to)),
      windows: mockWindows(id).filter((w) => this.inRange(w.occurredAt, from, to)),
    })
  }
}
