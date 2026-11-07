import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../api/ApiError'
import { getDashboardApi } from '../../api/apiProvider'
import type { DashboardApi } from '../../api/DashboardApi'
import { createMockApi } from '../../mocks/createMockApi'
import { MockDatabase } from '../../mocks/MockDatabase'
import { renderInCage } from '../../test/render'
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
    renderInCage(<CageOverview />)

    expect(await screen.findByText('1 cuy en alerta')).toBeInTheDocument()
    const grid = await screen.findByRole('list', { name: 'Tus cuyes' })
    for (const name of ['Cuy Rojo', 'Cuy Azul', 'Cuy Blanco', 'Cuy Naranja']) {
      expect(within(grid).getByText(name)).toBeInTheDocument()
    }
  })

  it('puts the guinea pigs that need attention first', async () => {
    renderInCage(<CageOverview />)
    const grid = await screen.findByRole('list', { name: 'Tus cuyes' })

    const names = within(grid)
      .getAllByText(/^Cuy /)
      .map((element) => element.textContent)
    // ORANGE is in ALERT, RED in OBSERVED, then the calm ones
    expect(names).toEqual(['Cuy Naranja', 'Cuy Rojo', 'Cuy Azul', 'Cuy Blanco'])
  })

  it('lists the open alerts next to the cage', async () => {
    renderInCage(<CageOverview />)

    expect(await screen.findByText(/quieta de lo normal/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver todas' })).toHaveAttribute(
      'href',
      '/alerts?cage=cage-1',
    )
  })

  it('stays calm when there are no open alerts', async () => {
    const db = new MockDatabase()
    db.alerts.length = 0
    setApi(createMockApi(db, 0))

    renderInCage(<CageOverview />)

    expect(await screen.findByText('No hay alertas abiertas.')).toBeInTheDocument()
  })

  it('invites to register a guinea pig when the cage is empty', async () => {
    const db = new MockDatabase()
    db.guineaPigs.length = 0
    setApi(createMockApi(db, 0))

    renderInCage(<CageOverview />)

    expect(await screen.findByText('Aún no hay cuyes registrados')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Registrar cuy' })).toHaveAttribute(
      'href',
      '/cages/cage-1/guinea-pigs/new',
    )
  })

  it('shows an error with retry and UNKNOWN when the data cannot be loaded', async () => {
    const api = createMockApi(undefined, 0)
    const failure = () => Promise.reject(new ApiError(0, 'network_error'))
    setApi({
      ...api,
      cages: { ...api.cages, getHealth: failure, getWeight: failure },
      guineaPigs: { ...api.guineaPigs, list: failure },
    })

    renderInCage(<CageOverview />)

    expect(await screen.findByText(/No pudimos cargar los cuyes/)).toBeInTheDocument()
    expect(await screen.findByText('No pudimos cargar el peso.')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Intentar de nuevo' })).toHaveLength(2)
    expect(screen.getByText('Aún no hay datos de la jaula')).toBeInTheDocument()
  })

  it('shows the name and place of the cage and a way back to every cage', async () => {
    renderInCage(<CageOverview />)

    expect(await screen.findByRole('heading', { name: 'Jaula piloto' })).toBeInTheDocument()
    expect(screen.getByText('Galpón')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Mis jaulas' })).toHaveAttribute('href', '/')
  })

  it('shows only the guinea pigs of the cage in the address', async () => {
    renderInCage(<CageOverview />, { cageId: 'cage-7f3a9c21' })

    const grid = await screen.findByRole('list', { name: 'Tus cuyes' })
    // the second cage has WHITE and PURPLE; RED lives in the pilot cage
    expect(within(grid).getByText('Cuy Morado')).toBeInTheDocument()
    expect(within(grid).queryByText('Cuy Rojo')).not.toBeInTheDocument()
  })

  it('finds a guinea pig by the color of its mark, without caring about accents or capitals', async () => {
    const user = userEvent.setup()
    renderInCage(<CageOverview />)
    const grid = await screen.findByRole('list', { name: 'Tus cuyes' })

    await user.type(screen.getByRole('searchbox', { name: 'Buscar cuy por color o raza' }), 'NARÁN')

    expect(within(grid).getByText('Cuy Naranja')).toBeInTheDocument()
    expect(within(grid).queryByText('Cuy Rojo')).not.toBeInTheDocument()
  })

  it('shows only the guinea pigs that need attention', async () => {
    const user = userEvent.setup()
    renderInCage(<CageOverview />)
    const grid = await screen.findByRole('list', { name: 'Tus cuyes' })

    await user.click(screen.getByRole('button', { name: 'Necesitan atención (2)' }))

    expect(within(grid).getByText('Cuy Rojo')).toBeInTheDocument()
    expect(within(grid).getByText('Cuy Naranja')).toBeInTheDocument()
    expect(within(grid).queryByText('Cuy Azul')).not.toBeInTheDocument()
  })

  it('offers to see every guinea pig again when nothing matches', async () => {
    const user = userEvent.setup()
    renderInCage(<CageOverview />)
    await screen.findByRole('list', { name: 'Tus cuyes' })

    await user.type(screen.getByRole('searchbox', { name: 'Buscar cuy por color o raza' }), 'zzz')
    expect(screen.getByText('Ningún cuy coincide con la búsqueda')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Ver todos' }))
    expect(await screen.findByRole('list', { name: 'Tus cuyes' })).toBeInTheDocument()
  })

  it('reloads the cage when "Actualizar" is pressed', async () => {
    const user = userEvent.setup()
    const api = createMockApi(undefined, 0)
    setApi(api)
    const getHealth = vi.spyOn(api.cages, 'getHealth')
    renderInCage(<CageOverview />)
    await screen.findByRole('list', { name: 'Tus cuyes' })
    const before = getHealth.mock.calls.length

    await user.click(screen.getByRole('button', { name: 'Actualizar' }))

    await waitFor(() => expect(getHealth.mock.calls.length).toBeGreaterThan(before))
  })

  it('shows the weight of the cage with only its stable readings', async () => {
    renderInCage(<CageOverview />)

    const weight = await screen.findByRole('region', { name: 'Peso de la jaula' })
    // the chart is loaded on demand
    expect(
      await within(weight).findByText(/^Última medición:/, undefined, { timeout: 5000 }),
    ).toBeInTheDocument()
    expect(within(weight).getByText(/cuyes quietos/)).toBeInTheDocument()
    expect(within(weight).getByRole('radio', { name: 'Hoy' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
  })
})
