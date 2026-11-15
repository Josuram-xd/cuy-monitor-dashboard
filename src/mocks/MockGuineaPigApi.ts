import type { GuineaPigApi } from '../api/DashboardApi'
import type { DateRange } from '../types/DateRange'
import type {
  GuineaPig,
  GuineaPigHistory,
  GuineaPigPhotoRequest,
  NewGuineaPig,
} from '../types/GuineaPig'
import { MAX_NOTES_LENGTH, MAX_WEIGHT_GRAMS, MIN_WEIGHT_GRAMS } from '../types/GuineaPigProfile'
import type { CatalogKind } from '../types/Catalog'
import { mockBaseline, mockCatalog, mockTransitions, mockWindows } from './data'
import { MockResource } from './MockResource'

// the same rules as the backend (contract 3.3)
const MAX_PHOTO_BYTES = 300 * 1024
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export class MockGuineaPigApi extends MockResource implements GuineaPigApi {
  list(cageId: string): Promise<GuineaPig[]> {
    if (!this.db.hasCage(cageId)) {
      return this.notFound()
    }
    return this.respond(this.db.guineaPigsOf(cageId))
  }

  register(cageId: string, body: NewGuineaPig): Promise<GuineaPig> {
    if (!this.db.hasCage(cageId)) {
      return this.notFound()
    }
    if (!isValidPhoto(body)) {
      return this.fail(400, 'bad_request', { photo: 'invalid' })
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
    const unknown =
      unknownCode('markColors', body.markColor) ??
      unknownCode('breeds', body.breed) ??
      unknownCode('coatColors', body.coatColor)
    if (unknown) {
      return this.fail(400, 'bad_request')
    }
    if (this.db.guineaPigsOf(cageId).some((g) => g.markColor === body.markColor)) {
      return this.fail(409, 'conflict')
    }
    const created: GuineaPig = {
      id: this.db.nextGuineaPigId(),
      photoUrl: `data:${body.photoContentType};base64,${body.photo}`,
      markColor: body.markColor,
      status: 'NORMAL',
      statusSince: new Date().toISOString(),
      breed: body.breed ?? null,
      coatColor: body.coatColor ?? null,
      initialWeightGrams: weight ?? null,
      notes: notes || null,
    }
    this.db.guineaPigsOf(cageId).push(created)
    return this.respond(created)
  }

  remove(cageId: string, id: number): Promise<void> {
    if (!this.db.hasCage(cageId)) {
      return this.notFound()
    }
    const guineaPigs = this.db.guineaPigsOf(cageId)
    const index = guineaPigs.findIndex((g) => g.id === id)
    if (index === -1) {
      return this.notFound()
    }
    // like the backend, the guinea pig leaves the list (and frees its color); the alerts it had stay
    guineaPigs.splice(index, 1)
    return this.respond(undefined)
  }

  setPhoto(cageId: string, id: number, body: GuineaPigPhotoRequest): Promise<void> {
    const guineaPig = this.find(cageId, id)
    if (!guineaPig) {
      return this.notFound()
    }
    if (!isValidPhoto(body)) {
      return this.fail(400, 'bad_request', { photo: 'invalid' })
    }
    guineaPig.photoUrl = `data:${body.photoContentType};base64,${body.photo}`
    return this.respond(undefined)
  }

  removePhoto(cageId: string, id: number): Promise<void> {
    const guineaPig = this.find(cageId, id)
    if (!guineaPig) {
      return this.notFound()
    }
    guineaPig.photoUrl = null
    return this.respond(undefined)
  }

  private find(cageId: string, id: number): GuineaPig | undefined {
    return this.db.hasCage(cageId)
      ? this.db.guineaPigsOf(cageId).find((g) => g.id === id)
      : undefined
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
      baseline: mockBaseline(id),
    })
  }
}

function isValidPhoto(body: GuineaPigPhotoRequest): boolean {
  return (
    Boolean(body.photo) &&
    PHOTO_TYPES.includes(body.photoContentType) &&
    Math.floor((body.photo.length * 3) / 4) <= MAX_PHOTO_BYTES
  )
}

// a code the catalog does not have is a 400 in the backend too
function unknownCode(kind: CatalogKind, code: string | undefined): string | undefined {
  if (code === undefined) {
    return undefined
  }
  return mockCatalog[kind].some((option) => option.code === code) ? undefined : code
}
