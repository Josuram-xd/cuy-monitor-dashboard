import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useParams, useLocation, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getDashboardApi } from '../../api/apiProvider'
import { createDemoMockApi, createMockApi } from '../../mocks/createMockApi'
import { renderWithProviders } from '../../test/render'
import { CageSwitch } from './CageSwitch'

vi.mock('../../api/apiProvider', () => ({ getDashboardApi: vi.fn() }))

// shows where the switch took the breeder
function Page() {
  const { cageId = '' } = useParams()
  const { pathname } = useLocation()
  return (
    <>
      <CageSwitch cageId={cageId} />
      <p>{`at ${pathname}`}</p>
    </>
  )
}

function renderPage(route: string) {
  return renderWithProviders(
    <Routes>
      <Route path="/cages/:cageId" element={<Page />} />
    </Routes>,
    { route },
  )
}

describe('CageSwitch', () => {
  beforeEach(() => {
    vi.mocked(getDashboardApi).mockResolvedValue(createDemoMockApi())
  })

  it('shows the real kit and the simulation side by side, with the one on screen chosen', async () => {
    renderPage('/cages/cage-1')

    const group = await screen.findByRole('radiogroup', { name: 'Qué estás viendo' })
    expect(group).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Equipo real' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    expect(screen.getByRole('radio', { name: 'Simulación con video' })).toHaveAttribute(
      'aria-checked',
      'false',
    )
  })

  it('opens the simulation cage when its option is chosen', async () => {
    const user = userEvent.setup()
    renderPage('/cages/cage-1')

    await user.click(await screen.findByRole('radio', { name: 'Simulación con video' }))

    expect(await screen.findByText('at /cages/sim-demo1234')).toBeInTheDocument()
  })

  it('is not shown when the account has only one of the two cages', async () => {
    const api = createMockApi(undefined, 0)
    vi.mocked(getDashboardApi).mockResolvedValue(api)
    const list = vi.spyOn(api.cages, 'list')
    renderPage('/cages/cage-1')

    await waitFor(() => expect(list).toHaveBeenCalled())
    await act(() => new Promise((resolve) => setTimeout(resolve, 20)))
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument()
  })
})
