import { screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { getDashboardApi } from '../../api/apiProvider'
import { createMockApi } from '../../mocks/createMockApi'
import { MockDatabase } from '../../mocks/MockDatabase'
import { mockSession } from '../../mocks/mockSession'
import { renderWithProviders } from '../../test/render'
import { BottomNav } from './BottomNav'

vi.mock('../../api/apiProvider', () => ({ getDashboardApi: vi.fn() }))

// a breeder unless asked: the mock profile is an admin, so its role is overridden here
async function renderAt(path: string, role: 'BREEDER' | 'ADMIN' = 'BREEDER') {
  mockSession.start()
  const api = createMockApi(new MockDatabase(), 0)
  const profile = await api.account.getProfile()
  vi.spyOn(api.account, 'getProfile').mockResolvedValue({ ...profile, role })
  vi.mocked(getDashboardApi).mockResolvedValue(api)
  renderWithProviders(<BottomNav />, { route: path })
  // the bar is drawn once the role is known
  await screen.findByRole('link', { name: role === 'ADMIN' ? 'Monitoreo' : 'Jaulas' })
}

const current = () =>
  screen
    .getAllByRole('link')
    .filter((link) => link.getAttribute('aria-current') === 'page')
    .map((link) => link.textContent)

describe('BottomNav', () => {
  afterEach(() => {
    mockSession.end()
  })

  it('lights "Jaulas" on the list of cages and inside a cage', async () => {
    await renderAt('/')
    expect(current()).toEqual(['Jaulas'])
  })

  it('keeps "Jaulas" lit on every page of a cage', async () => {
    await renderAt('/cages/cage-1/guinea-pigs/3')
    expect(current()).toEqual(['Jaulas'])
  })

  it('lights only one tab at a time', async () => {
    await renderAt('/alerts')
    expect(current()).toEqual(['Alertas'])
  })

  it('lights no tab on a page that has none', async () => {
    await renderAt('/settings')
    expect(current()).toEqual([])
  })

  it('gives an admin the monitoring panel instead of cages and alerts', async () => {
    await renderAt('/admin', 'ADMIN')
    expect(current()).toEqual(['Monitoreo'])
    expect(screen.queryByRole('link', { name: 'Jaulas' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Alertas' })).not.toBeInTheDocument()
  })
})
