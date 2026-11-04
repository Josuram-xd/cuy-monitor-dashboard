import type { CatalogApi } from '../api/DashboardApi'
import type { Catalog } from '../types/Catalog'
import { mockCatalog } from './data'
import { MockResource } from './MockResource'

export class MockCatalogApi extends MockResource implements CatalogApi {
  get(): Promise<Catalog> {
    return this.respond(mockCatalog)
  }
}
