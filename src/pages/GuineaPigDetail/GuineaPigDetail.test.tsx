import { screen, within } from '@testing-library/react'
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
      <Route path="/guinea-pigs/:id" element={<GuineaPigDetail />} />
      <Route path="/" element={<p>cage view</p>} />
    </Routes>,
    { route: `/guinea-pigs/${id}` },
  )
}

describe('GuineaPigDetail', () => {
  let db: MockDatabase
  let api: DashboardApi

  beforeEach(() => {
    db = new MockDatabase()
    api = createMockApi(db, 0)
  })

  it('shows who the cuy is, how it is doing and what the owner told', async () => {
    // Canela: Teddy, cinnamon, 860 g, observed, with a note
    renderAt(api, '1')

    expect(await screen.findByRole('heading', { level: 1, name: 'Canela' })).toBeInTheDocument()
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
    // Copito was registered without a profile
    renderAt(api, '3')

    await screen.findByRole('heading', { level: 1, name: 'Copito' })
    expect(screen.getAllByText('Sin dato')).toHaveLength(3)
  })

  it('lists only the alerts of that cuy', async () => {
    // the fake cage has one open alert about Chispa (4) and none about Pelusa (2)
    renderAt(api, '4')
    const alerts = await screen.findByRole('region', { name: 'Alertas de Chispa' })
    expect(await within(alerts).findByText(/quieta de lo normal/)).toBeInTheDocument()
  })

  it('is calm when the cuy has no alerts', async () => {
    renderAt(api, '2')

    expect(await screen.findByText('Pelusa no tiene alertas. ¡Todo tranquilo!')).toBeInTheDocument()
  })

  it('says so when the cuy does not exist and offers the way back', async () => {
    renderAt(api, '999')

    expect(await screen.findByText(/No encontramos a este cuy/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Volver a la jaula' })).toHaveAttribute('href', '/')
  })

  it('tells that the history is still to come', async () => {
    renderAt(api, '1')

    expect(await screen.findByText('Historial de comportamiento y peso')).toBeInTheDocument()
    expect(screen.getByText('Estará disponible muy pronto.')).toBeInTheDocument()
  })
})
