import type { Catalog } from '../../types/Catalog'
import type { CatalogApi } from '../DashboardApi'
import type { HttpClient } from '../HttpClient'

export class HttpCatalogApi implements CatalogApi {
  private readonly http: HttpClient

  constructor(http: HttpClient) {
    this.http = http
  }

  get(signal?: AbortSignal): Promise<Catalog> {
    return this.http.get<Catalog>('/api/v1/catalog', { signal })
  }
}
