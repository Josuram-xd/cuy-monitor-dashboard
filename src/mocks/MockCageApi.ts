import type { CageApi } from '../api/DashboardApi'
import type { Cage, CageInput } from '../types/Cage'
import { MAX_CAGE_LOCATION_LENGTH, MAX_CAGE_NAME_LENGTH } from '../types/Cage'
import type { CageHealth } from '../types/CageHealth'
import type { StationCamera, StationCameraInput } from '../types/StationCamera'
import type { DateRange } from '../types/DateRange'
import { worstStatus } from '../types/HealthStatus'
import type { CageWeight } from '../types/WeightReading'
import { mockAudio } from './data'
import { MockResource } from './MockResource'

// how long the mock keeps a saved camera PENDING, so the connecting progress can be seen in demo mode
const MOCK_PENDING_MS = 8_000

const NO_CAMERA: StationCamera = {
  type: null,
  host: null,
  port: null,
  username: null,
  stream: null,
  hasPassword: false,
  status: 'NOT_CONFIGURED',
  statusAt: null,
}

export class MockCageApi extends MockResource implements CageApi {
  // the camera of each cage, in memory: PENDING right after saving, CONNECTED on the next read
  private readonly cameras = new Map<string, StationCamera>()
  // cages whose kit is connected: only then the real backend reports `monitoring` (and the camera panel shows)
  private readonly connected = new Map<string, string>()
  // when each PENDING camera turns CONNECTED
  private readonly pendingUntil = new Map<string, number>()

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
    const guineaPigs = this.db.guineaPigsOf(cageId).map(({ id, photoUrl, markColor, status }) => ({
      id,
      photoUrl,
      markColor,
      status,
    }))
    return this.respond({
      cageId,
      status: worstStatus([...guineaPigs.map((g) => g.status), mockAudio.status, weight.status]),
      guineaPigs,
      audio: mockAudio,
      weight,
      ...(this.connected.has(cageId) && {
        monitoring: {
          connectedAt: this.connected.get(cageId)!,
          lastBehaviorAt: null,
          lastAudioLabel: null,
        },
      }),
      updatedAt: new Date().toISOString(),
    })
  }

  // no AI service in mock mode: only the connected flag changes, so the camera panel can be tried in the demo
  setEquipment(cageId: string, connect: boolean): Promise<void> {
    if (!this.db.hasCage(cageId)) {
      return this.notFound()
    }
    if (connect) {
      this.connected.set(cageId, new Date().toISOString())
    } else {
      this.connected.delete(cageId)
    }
    return this.respond(undefined)
  }

  startSimulation(cageId: string): Promise<void> {
    return this.db.hasCage(cageId) ? this.respond(undefined) : this.notFound()
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

  getCamera(cageId: string): Promise<StationCamera> {
    if (!this.db.hasCage(cageId)) {
      return this.notFound()
    }
    const camera = this.cameras.get(cageId)
    if (camera?.status === 'PENDING' && Date.now() >= (this.pendingUntil.get(cageId) ?? 0)) {
      camera.status = 'CONNECTED'
      camera.statusAt = new Date().toISOString()
    }
    return this.respond({ ...(camera ?? NO_CAMERA) })
  }

  saveCamera(cageId: string, body: StationCameraInput): Promise<void> {
    if (!this.db.hasCage(cageId)) {
      return this.notFound()
    }
    const previous = this.cameras.get(cageId)
    // like the backend: a blank password keeps the one saved, and an RTSP camera needs one the first time
    const hasPassword = !!body.password || (!!previous?.hasPassword && body.type === 'RTSP')
    if (body.type === 'RTSP' && !hasPassword) {
      return this.fail(400, 'bad_request', { password: 'required' })
    }
    const rtsp = body.type === 'RTSP'
    this.cameras.set(cageId, {
      type: body.type,
      host: body.host,
      port: body.port ?? (rtsp ? 554 : 8080),
      username: rtsp ? (body.username ?? null) : null,
      stream: rtsp ? (body.stream ?? 'stream2') : null,
      hasPassword: rtsp && hasPassword,
      status: 'PENDING',
      statusAt: null,
    })
    this.pendingUntil.set(cageId, Date.now() + MOCK_PENDING_MS)
    return this.respond(undefined)
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
