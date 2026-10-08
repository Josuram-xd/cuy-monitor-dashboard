import { screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../api/ApiError'
import { getDashboardApi } from '../../api/apiProvider'
import type { DashboardApi } from '../../api/DashboardApi'
import { createMockApi } from '../../mocks/createMockApi'
import { MockDatabase } from '../../mocks/MockDatabase'
import { renderWithProviders } from '../../test/render'
import { CageOverview } from './CageOverview'

vi.mock('../../api/apiProvider', () => ({ getDashboardApi: vi.fn() }))

function setApi(api: DashboardApi) {
  vi.mocked(getDashboardApi).mockResolvedValue(api)
}

describe('CageOverview', () => {
  beforeEach(() => {
    setApi(createMockApi(undefined, 0))
  })

  it('shows the cage status and one card per guinea pig', async () => {
    renderWithProviders(<CageOverview />)

    expect(await screen.findByText('1 cuy en alerta')).toBeInTheDocument()
    const grid = await screen.findByRole('list', { name: 'Tus cuyes' })
    for (const name of ['Canela', 'Pelusa', 'Copito', 'Chispa']) {
      expect(within(grid).getByText(name)).toBeInTheDocument()
    }
  })

  it('lists the open alerts next to the cage', async () => {
    renderWithProviders(<CageOverview />)

    expect(await screen.findByText(/quieta de lo normal/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver todas' })).toHaveAttribute('href', '/alerts')
  })

  it('stays calm when there are no open alerts', async () => {
    const db = new MockDatabase()
    db.alerts.length = 0
    setApi(createMockApi(db, 0))

    renderWithProviders(<CageOverview />)

    expect(await screen.findByText('No hay alertas abiertas.')).toBeInTheDocument()
  })

  it('invites to register a guinea pig when the cage is empty', async () => {
    const db = new MockDatabase()
    db.guineaPigs.length = 0
    setApi(createMockApi(db, 0))

    renderWithProviders(<CageOverview />)

    expect(await screen.findByText('Aún no hay cuyes registrados')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Registrar cuy' })).toHaveAttribute(
      'href',
      '/guinea-pigs/new',
    )
  })

  it('shows an error with retry and UNKNOWN when the data cannot be loaded', async () => {
    const api = createMockApi(undefined, 0)
    const failure = () => Promise.reject(new ApiError(0, 'network_error'))
    setApi({
      ...api,
      cages: { ...api.cages, getHealth: failure },
      guineaPigs: { ...api.guineaPigs, list: failure },
    })

    renderWithProviders(<CageOverview />)

    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos cargar los cuyes')
    expect(screen.getByRole('button', { name: 'Intentar de nuevo' })).toBeInTheDocument()
    expect(screen.getByText('Aún no hay datos de la jaula')).toBeInTheDocument()
  })
})
