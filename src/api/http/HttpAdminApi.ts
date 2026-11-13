import type {
  AdminCatalogKind,
  AdminCatalogOption,
  AdminCatalogOptionInput,
  AdminUser,
  UserRole,
} from '../../types/Admin'
import type { AdminApi } from '../DashboardApi'
import type { HttpClient } from '../HttpClient'

export class HttpAdminApi implements AdminApi {
  private readonly http: HttpClient

  constructor(http: HttpClient) {
    this.http = http
  }

  listCatalog(signal?: AbortSignal): Promise<AdminCatalogOption[]> {
    return this.http.get<AdminCatalogOption[]>('/api/v1/admin/catalog', { signal })
  }

  saveCatalogOption(body: AdminCatalogOptionInput): Promise<AdminCatalogOption> {
    return this.http.put<AdminCatalogOption>('/api/v1/admin/catalog', body)
  }

  deactivateCatalogOption(kind: AdminCatalogKind, code: string): Promise<AdminCatalogOption> {
    return this.http.delete<AdminCatalogOption>(`/api/v1/admin/catalog/${kind}/${code}`)
  }

  listUsers(signal?: AbortSignal): Promise<AdminUser[]> {
    return this.http.get<AdminUser[]>('/api/v1/admin/users', { signal })
  }

  changeUserRole(id: string, role: UserRole): Promise<AdminUser> {
    return this.http.patch<AdminUser>(`/api/v1/admin/users/${id}`, { role })
  }

  setUserEnabled(id: string, enabled: boolean): Promise<AdminUser> {
    return this.http.patch<AdminUser>(`/api/v1/admin/users/${id}`, { enabled })
  }
}
