import type { CageApi } from '../api/DashboardApi'
import type { Cage, CageInput } from '../types/Cage'
import { MAX_CAGE_LOCATION_LENGTH, MAX_CAGE_NAME_LENGTH, SIMULATION_CODE_PREFIX } from '../types/Cage'
import type { CageHealth } from '../types/CageHealth'
import type { StationCamera, StationCameraInput } from '../types/StationCamera'
import type { DateRange } from '../types/DateRange'
import type { SimulationStatus } from '../types/Simulation'
import { worstStatus } from '../types/HealthStatus'
import type { CageWeight } from '../types/WeightReading'
import { mockAudio, mockPhoto, mockSimulationCredit } from './data'
import { MockResource } from './MockResource'

// how long the mock keeps a saved camera PENDING, so the connecting progress can be seen in demo mode
const MOCK_PENDING_MS = 8_000
// like the AI service: at most two videos at once, each one stops by itself after an hour
const MOCK_MAX_SIMULATIONS = 2
const MOCK_SIMULATION_MS = 60 * 60_000
// the mark colors of the clip, and how many frames it has (one per second)
const SIMULATION_MARK_COLORS = ['RED', 'BLUE', 'GREEN']
const MOCK_CLIP_FRAMES = 180

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
  // cage id -> when its video simulation started
  private readonly simulations = new Map<string, number>()

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
      simulated: false,
      monitored: false,
    }
    this.db.cages.push(created)
    return this.respond(created)
  }

  // one per account, like the backend: the existing one, or a new one with a guinea pig per clip color
  createSimulationCage(): Promise<Cage> {
    const existing = this.db.cages.find((c) => c.simulated)
    if (existing) {
      return this.respond(existing)
    }
    const cage: Cage = {
      cageId: `${SIMULATION_CODE_PREFIX}${Math.floor(Math.random() * 0xffffffff)
        .toString(16)
        .padStart(8, '0')}`,
      name: 'Simulación',
      location: null,
      createdAt: new Date().toISOString(),
      simulated: true,
      monitored: false,
    }
    this.db.cages.push(cage)
    const guineaPigs = this.db.guineaPigsOf(cage.cageId)
    for (const markColor of SIMULATION_MARK_COLORS) {
      guineaPigs.push({
        id: this.db.nextGuineaPigId(),
        photoUrl: mockPhoto(markColor),
        markColor,
        status: 'NORMAL',
        statusSince: cage.createdAt,
      })
    }
    return this.respond(cage)
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
    const cage = this.db.cages.find((c) => c.cageId === cageId)
    if (!cage) {
      return this.notFound()
    }
    if (connect) {
      this.connected.set(cageId, new Date().toISOString())
    } else {
      this.connected.delete(cageId)
    }
    cage.monitored = connect
    return this.respond(undefined)
  }

  // a drawn cage only checks that it exists; a simulation cage starts its video (the second start does nothing)
  startSimulation(cageId: string): Promise<void> {
    const cage = this.db.cages.find((c) => c.cageId === cageId)
    if (!cage) {
      return this.notFound()
    }
    if (!cage.simulated || this.startedAt(cageId) !== undefined) {
      return this.respond(undefined)
    }
    const running = this.db.cages.filter((c) => this.startedAt(c.cageId) !== undefined).length
    if (running >= MOCK_MAX_SIMULATIONS) {
      return this.fail(409, 'conflict')
    }
    this.simulations.set(cageId, Date.now())
    return this.respond(undefined)
  }

  stopSimulation(cageId: string): Promise<void> {
    if (!this.db.hasCage(cageId)) {
      return this.notFound()
    }
    this.simulations.delete(cageId)
    return this.respond(undefined)
  }

  getSimulationStatus(cageId: string): Promise<SimulationStatus> {
    const cage = this.db.cages.find((c) => c.cageId === cageId)
    if (!cage) {
      return this.notFound()
    }
    const startedAt = this.startedAt(cageId)
    const running = startedAt !== undefined
    return this.respond({
      running,
      startedAt: running ? new Date(startedAt).toISOString() : null,
      framesSent: running ? Math.floor((Date.now() - startedAt) / 1000) : 0,
      frameCount: MOCK_CLIP_FRAMES,
      credit: cage.simulated ? mockSimulationCredit : null,
    })
  }

  // when the video of a cage started, or undefined when it does not run (an hour later it stops by itself)
  private startedAt(cageId: string): number | undefined {
    const startedAt = this.simulations.get(cageId)
    if (startedAt !== undefined && Date.now() - startedAt >= MOCK_SIMULATION_MS) {
      this.simulations.delete(cageId)
      return undefined
    }
    return startedAt
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
