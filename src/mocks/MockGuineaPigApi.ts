import type { GuineaPigApi } from '../api/DashboardApi'
import type { DateRange } from '../types/DateRange'
import type { GuineaPig, GuineaPigHistory, NewGuineaPig } from '../types/GuineaPig'
import { MAX_NOTES_LENGTH, MAX_WEIGHT_GRAMS, MIN_WEIGHT_GRAMS } from '../types/GuineaPigProfile'
import { base64Bytes, MAX_PHOTO_BYTES, PHOTO_CONTENT_TYPES } from '../utils/photo'
import type { CatalogKind } from '../types/Catalog'
import { mockCatalog, mockTransitions, mockWindows } from './data'
import { MockResource } from './MockResource'

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
    // the same limits as the backend and the CHECK of the database
    if (
      !body.photo ||
      !PHOTO_CONTENT_TYPES.includes(body.photoContentType) ||
      base64Bytes(body.photo) > MAX_PHOTO_BYTES
    ) {
      return this.fail(400, 'bad_request')
    }
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
    const unknown =
      unknownCode('markColors', body.markColor) ??
      unknownCode('breeds', body.breed) ??
      unknownCode('coatColors', body.coatColor)
    if (unknown) {
      return this.fail(400, 'bad_request')
    }
    if (this.db.guineaPigs.some((g) => g.markColor === body.markColor)) {
      return this.fail(409, 'conflict')
    }
    const created: GuineaPig = {
      id: this.db.nextGuineaPigId(),
      // the real backend answers a path and serves the bytes; here the photo travels inline
      photoUrl: `data:${body.photoContentType};base64,${body.photo}`,
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

// a code the catalog does not have is a 400 in the backend too
function unknownCode(kind: CatalogKind, code: string | undefined): string | undefined {
  if (code === undefined) {
    return undefined
  }
  return mockCatalog[kind].some((option) => option.code === code) ? undefined : code
}
