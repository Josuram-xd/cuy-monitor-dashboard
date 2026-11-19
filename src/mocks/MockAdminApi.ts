import type { AdminApi } from '../api/DashboardApi'
import type {
  AdminCatalogKind,
  AdminCatalogOption,
  AdminCatalogOptionInput,
  AdminUser,
  AiLogEntry,
  AdminSetting,
  UserRole,
} from '../types/Admin'
import { mockCatalog } from './data'
import { MockResource } from './MockResource'

// The breeder's catalog is keyed by what the pickers call it; the admin one by what the backend calls it
const KINDS: Array<[keyof typeof mockCatalog, AdminCatalogKind]> = [
  ['markColors', 'MARK_COLOR'],
  ['coatColors', 'COAT_COLOR'],
  ['breeds', 'BREED'],
]

function seedCatalog(): AdminCatalogOption[] {
  return KINDS.flatMap(([key, kind]) =>
    mockCatalog[key].map((option, index) => ({
      kind,
      code: option.code,
      label: option.label,
      hex: option.hex,
      sortOrder: index + 1,
      active: true,
    })),
  )
}

const DEMO_USERS: AdminUser[] = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    username: 'demo',
    fullName: 'Usuario de prueba',
    email: 'demo@cuymonitor.local',
    status: 'ACTIVE',
    role: 'ADMIN',
    createdAt: '2026-01-10T12:00:00Z',
    cages: 2,
    guineaPigs: 4,
    openAlerts: 1,
    lastActivityAt: new Date(Date.now() - 4 * 60_000).toISOString(),
  },
  {
    id: '00000000-0000-4000-8000-000000000002',
    username: 'criador',
    fullName: 'Ana Quispe',
    email: 'ana@cuymonitor.local',
    status: 'ACTIVE',
    role: 'BREEDER',
    createdAt: '2026-03-02T09:30:00Z',
    cages: 30,
    guineaPigs: 96,
    openAlerts: 7,
    lastActivityAt: new Date(Date.now() - 2 * 3_600_000).toISOString(),
  },
  {
    id: '00000000-0000-4000-8000-000000000003',
    username: 'rosa',
    fullName: 'Rosa Huamán',
    email: 'rosa@cuymonitor.local',
    status: 'PENDING_VERIFICATION',
    role: 'BREEDER',
    createdAt: '2026-11-01T18:05:00Z',
    cages: 0,
    guineaPigs: 0,
    openAlerts: 0,
    lastActivityAt: null,
  },
]

/** In mock mode the demo account is an admin, so the panel can be shown without a backend. */
export class MockAdminApi extends MockResource implements AdminApi {
  private catalog = seedCatalog()
  private users = structuredClone(DEMO_USERS)
  private settings = seedSettings()

  listCatalog(): Promise<AdminCatalogOption[]> {
    return this.respond(this.catalog)
  }

  saveCatalogOption(body: AdminCatalogOptionInput): Promise<AdminCatalogOption> {
    const code = body.code.trim().toUpperCase()
    if (!/^[A-Z0-9_]+$/.test(code)) return this.fail(400, 'bad_request')
    const saved: AdminCatalogOption = {
      kind: body.kind,
      code,
      label: body.label.trim(),
      hex: body.hex ?? null,
      sortOrder: body.sortOrder,
      active: body.active ?? true,
    }
    this.catalog = [
      ...this.catalog.filter((o) => !(o.kind === saved.kind && o.code === saved.code)),
      saved,
    ]
    return this.respond(saved)
  }

  deactivateCatalogOption(kind: AdminCatalogKind, code: string): Promise<AdminCatalogOption> {
    const found = this.catalog.find((o) => o.kind === kind && o.code === code)
    if (!found) return this.fail(400, 'bad_request')
    const off = { ...found, active: false }
    this.catalog = this.catalog.map((o) => (o === found ? off : o))
    return this.respond(off)
  }

  listUsers(): Promise<AdminUser[]> {
    return this.respond(this.users)
  }

  listSettings(): Promise<AdminSetting[]> {
    return this.respond(this.settings)
  }

  updateSettings(changes: Record<string, string>): Promise<AdminSetting[]> {
    const next = this.settings.map((s) => ({ ...s }))
    for (const [key, value] of Object.entries(changes)) {
      const setting = next.find((s) => s.key === key)
      if (!setting) return this.fail(400, 'bad_request')
      if (setting.kind === 'TEXT') {
        if (value.trim().length < setting.min || value.trim().length > setting.max) {
          return this.fail(400, 'bad_request')
        }
      } else {
        const number = Number(value)
        if (!Number.isFinite(number) || number < setting.min || number > setting.max) {
          return this.fail(400, 'bad_request')
        }
      }
      setting.value = value.trim()
    }
    this.settings = next
    return this.respond(this.settings)
  }

  resetSettings(): Promise<AdminSetting[]> {
    this.settings = this.settings.map((s) => ({ ...s, value: s.defaultValue }))
    return this.respond(this.settings)
  }

  aiLog(limit = 100): Promise<AiLogEntry[]> {
    const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString()
    const log: AiLogEntry[] = [
      {
        at: ago(2),
        cageCode: 'cage-1',
        kind: 'NOTE',
        detail: 'El cuy rojo lleva casi una hora quieto y sin comer: revísalo y, si sigue así, llama al veterinario.',
      },
      {
        at: ago(3),
        cageCode: 'cage-1',
        kind: 'BEHAVIOR',
        detail: 'RED: quieto 55.0 s de 60 s, comedero 0, bebedero 0, anomalía 0.3',
      },
      { at: ago(9), cageCode: 'cage-1', kind: 'AUDIO', detail: 'DISTRESS (probabilidad 0.91)' },
    ]
    return this.respond(log.slice(0, limit))
  }

  changeUserRole(id: string, role: UserRole): Promise<AdminUser> {
    // the same rules the backend enforces, so the panel can be tried against the mocks
    if (id === DEMO_USERS[0].id) return this.fail(400, 'bad_request')
    const target = this.users.find((u) => u.id === id)
    if (!target) return this.notFound()
    if (target.role === 'ADMIN' && role !== 'ADMIN' && this.admins() <= 1) {
      return this.fail(400, 'bad_request')
    }
    return this.respond(this.update({ ...target, role }))
  }

  setUserEnabled(id: string, enabled: boolean): Promise<AdminUser> {
    if (id === DEMO_USERS[0].id) return this.fail(400, 'bad_request')
    const target = this.users.find((u) => u.id === id)
    if (!target) return this.notFound()
    if (!enabled && target.role === 'ADMIN' && this.admins() <= 1) {
      return this.fail(400, 'bad_request')
    }
    return this.respond(this.update({ ...target, status: enabled ? 'ACTIVE' : 'DISABLED' }))
  }

  private admins(): number {
    return this.users.filter((u) => u.role === 'ADMIN').length
  }

  private update(user: AdminUser): AdminUser {
    this.users = this.users.map((u) => (u.id === user.id ? user : u))
    return user
  }
}

// the same keys, ranges and defaults as the backend (application.yml), so the panel can be shown without it
function seedSettings(): AdminSetting[] {
  const n = (key: string, kind: 'INTEGER' | 'DECIMAL', value: string, min: number, max: number) => ({
    key,
    kind,
    value,
    defaultValue: value,
    min,
    max,
  })
  const text = (key: string, value: string) => ({
    key,
    kind: 'TEXT' as const,
    value,
    defaultValue: value,
    min: 1,
    max: 500,
  })
  return [
    n('health.maxEventAgeMinutes', 'INTEGER', '10', 1, 60),
    n('health.minDetectionConfidence', 'DECIMAL', '0.5', 0, 1),
    n('health.consecutiveAnomalyWindows', 'INTEGER', '3', 1, 20),
    n('health.distressProbability', 'DECIMAL', '0.8', 0.5, 1),
    n('health.observedToAlertMinutes', 'INTEGER', '30', 1, 240),
    n('health.alertToCriticalMinutes', 'INTEGER', '60', 1, 480),
    n('health.recoveryWindows', 'INTEGER', '5', 1, 30),
    n('health.classifierThreshold', 'DECIMAL', '0.7', 0.1, 1),
    n('health.stillFactor', 'DECIMAL', '1.5', 1.05, 5),
    n('health.groupDistanceFactor', 'DECIMAL', '2', 1.05, 5),
    n('health.baselineMinSamples', 'INTEGER', '30', 1, 500),
    n('health.baselineWarmupSamples', 'INTEGER', '60', 1, 1000),
    n('health.weightDropPercent', 'INTEGER', '10', 1, 50),
    n('health.weightRecentHours', 'INTEGER', '24', 1, 72),
    n('health.weightBaselineDays', 'INTEGER', '6', 1, 30),
    n('health.weightMinReadings', 'INTEGER', '5', 1, 100),
    text('message.alert', 'Comportamiento fuera de lo normal de forma sostenida'),
    text('message.critical', 'El comportamiento fuera de lo normal empeoró y sigue'),
    text('message.distress', 'Se escucharon chillidos de angustia en la jaula'),
    text('message.weightDrop', 'El peso de la jaula bajó un {porcentaje} % frente a los días anteriores'),
    n('assistant.maxQuestions', 'INTEGER', '0', 0, 1000),
    n('assistant.windowMinutes', 'INTEGER', '10', 1, 1440),
  ]
}
