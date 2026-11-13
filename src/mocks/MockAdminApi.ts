import type { AdminApi } from '../api/DashboardApi'
import type {
  AdminCatalogKind,
  AdminCatalogOption,
  AdminCatalogOptionInput,
  AdminUser,
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
  },
  {
    id: '00000000-0000-4000-8000-000000000002',
    username: 'criador',
    fullName: 'Ana Quispe',
    email: 'ana@cuymonitor.local',
    status: 'ACTIVE',
    role: 'BREEDER',
    createdAt: '2026-03-02T09:30:00Z',
  },
  {
    id: '00000000-0000-4000-8000-000000000003',
    username: 'rosa',
    fullName: 'Rosa Huamán',
    email: 'rosa@cuymonitor.local',
    status: 'PENDING_VERIFICATION',
    role: 'BREEDER',
    createdAt: '2026-11-01T18:05:00Z',
  },
]

/** In mock mode the demo account is an admin, so the panel can be shown without a backend. */
export class MockAdminApi extends MockResource implements AdminApi {
  private catalog = seedCatalog()
  private users = structuredClone(DEMO_USERS)

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
