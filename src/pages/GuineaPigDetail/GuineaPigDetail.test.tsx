import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getDashboardApi } from '../../api/apiProvider'
import type { DashboardApi } from '../../api/DashboardApi'
import { createMockApi } from '../../mocks/createMockApi'
import { MockDatabase } from '../../mocks/MockDatabase'
import { renderWithProviders } from '../../test/render'
import { GuineaPigDetail } from './GuineaPigDetail'

vi.mock('../../api/apiProvider', () => ({ getDashboardApi: vi.fn() }))

function renderAt(api: DashboardApi, id: string) {
  vi.mocked(getDashboardApi).mockResolvedValue(api)
  renderWithProviders(
    <Routes>
      <Route path="/cages/:cageId/guinea-pigs/:id" element={<GuineaPigDetail />} />
      <Route path="/cages/:cageId" element={<p>cage view</p>} />
    </Routes>,
    { route: `/cages/cage-1/guinea-pigs/${id}` },
  )
}

describe('GuineaPigDetail', () => {
  let db: MockDatabase
  let api: DashboardApi

  beforeEach(() => {
    db = new MockDatabase()
    api = createMockApi(db, 0)
  })

  it('shows who the guinea pig is, how it is doing and what the owner told', async () => {
    // RED (1): Teddy, cinnamon coat, 860 g, observed, with a note
    renderAt(api, '1')

    expect(await screen.findByRole('heading', { level: 1, name: 'Cuy Rojo' })).toBeInTheDocument()
    expect(screen.getByText('En observación')).toBeInTheDocument()
    expect(screen.getByText(/^desde /)).toBeInTheDocument()
    const facts = screen.getByRole('region', { name: 'Datos' })
    expect(within(facts).getByText('Teddy')).toBeInTheDocument()
    expect(within(facts).getByText('Canela', { selector: 'span' })).toBeInTheDocument()
    expect(within(facts).getByText('860 g')).toBeInTheDocument()
    expect(within(facts).getByText('Rojo')).toBeInTheDocument()
    expect(screen.getByText('La más curiosa de la jaula.')).toBeInTheDocument()
  })

  it('says "Sin dato" for what was not filled in', async () => {
    // WHITE (3) was registered without a profile
    renderAt(api, '3')

    await screen.findByRole('heading', { level: 1, name: 'Cuy Blanco' })
    expect(screen.getAllByText('Sin dato')).toHaveLength(3)
  })

  it('lists only the alerts of that guinea pig', async () => {
    // the fake cage has one open alert about ORANGE (4) and none about BLUE (2)
    renderAt(api, '4')
    const alerts = await screen.findByRole('region', { name: 'Alertas de Cuy Naranja' })
    expect(await within(alerts).findByText(/quieta de lo normal/)).toBeInTheDocument()
  })

  it('shows only its latest three alerts, titled by what they are about, and links to the rest', async () => {
    // RED (1) has a long list of alerts in the fake history
    renderAt(api, '1')
    const alerts = await screen.findByRole('region', { name: 'Alertas de Cuy Rojo' })

    await waitFor(() => expect(within(alerts).getAllByRole('listitem')).toHaveLength(3))
    // inside its own page the name is not repeated in every alert
    expect(within(alerts).queryByText('Cuy Rojo')).not.toBeInTheDocument()
    expect(within(alerts).getAllByText(/Comportamiento|Sonido|Peso/).length).toBeGreaterThan(0)
    expect(within(alerts).getByRole('link', { name: /Ver sus \d+ alertas/ })).toHaveAttribute(
      'href',
      '/alerts?cage=cage-1',
    )
  })

  it('shows how it has been doing before its alerts', async () => {
    renderAt(api, '1')
    const history = await screen.findByRole('region', { name: 'Historial' })
    const alerts = screen.getByRole('region', { name: 'Alertas de Cuy Rojo' })

    expect(history.compareDocumentPosition(alerts) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('is calm when the guinea pig has no alerts', async () => {
    renderAt(api, '2')

    expect(
      await screen.findByText('Cuy Azul no tiene alertas. ¡Todo tranquilo!'),
    ).toBeInTheDocument()
  })

  it('says so when the guinea pig does not exist and offers the way back', async () => {
    renderAt(api, '999')

    expect(await screen.findByText(/No encontramos a este cuy/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Volver a mis jaulas' })).toHaveAttribute(
      'href',
      '/cages/cage-1',
    )
  })

  it('shows the states and the behavior of the guinea pig in the period', async () => {
    // ORANGE (4) went from Normal to observed and then to alert in the last two hours. "Hoy" starts at
    // midnight, so right after midnight those changes are yesterday: 7 days holds them at any hour
    renderAt(api, '4')

    const history = await screen.findByRole('region', { name: 'Historial' })
    await userEvent.click(within(history).getByRole('radio', { name: '7 días' }))
    expect(
      await within(history).findByRole('list', { name: 'Cambios de estado' }),
    ).toBeInTheDocument()
    expect(within(history).getAllByRole('listitem').length).toBeGreaterThanOrEqual(2)
    expect(
      await within(history).findByText(/estuvo quieto|se movió|más activo/, undefined, {
        timeout: 5000,
      }),
    ).toBeInTheDocument()
    expect(within(history).getByText(/^Lo normal para él/)).toBeInTheDocument()
    expect(within(history).getByText('Ver los datos como tabla')).toBeInTheDocument()
  })

  it('asks the history again when another period is chosen', async () => {
    const getHistory = vi.spyOn(api.guineaPigs, 'getHistory')
    renderAt(api, '2')
    const history = await screen.findByRole('region', { name: 'Historial' })
    // the chart is loaded on demand: the first time it can take longer than findBy's default second
    await within(history).findByText('Ver los datos como tabla', undefined, { timeout: 5000 })

    await userEvent.click(within(history).getByRole('radio', { name: '7 días' }))

    expect(within(history).getByRole('radio', { name: '7 días' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    const [, range] = getHistory.mock.calls.at(-1) ?? []
    expect(Date.parse(range?.to ?? '') - Date.parse(range?.from ?? '')).toBe(7 * 86_400_000)
  })
})
