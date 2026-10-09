import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../api/ApiError'
import { getDashboardApi } from '../../api/apiProvider'
import { createMockApi } from '../../mocks/createMockApi'
import { MockDatabase } from '../../mocks/MockDatabase'
import { renderWithProviders } from '../../test/render'
import { Alerts } from './Alerts'

vi.mock('../../api/apiProvider', () => ({ getDashboardApi: vi.fn() }))

function setup(db = new MockDatabase()) {
  const api = createMockApi(db, 0)
  vi.mocked(getDashboardApi).mockResolvedValue(api)
  renderWithProviders(<Alerts />)
  return { api, db }
}

describe('Alerts', () => {
  beforeEach(() => {
    vi.mocked(getDashboardApi).mockReset()
  })

  it('lists the open alerts with the guinea pig they are about', async () => {
    const { db } = setup()

    const open = await screen.findByRole('region', { name: /Alertas abiertas/ })
    const openAlerts = db.alerts.filter((a) => a.status === 'OPEN')
    expect(openAlerts.length).toBeGreaterThan(0)
    expect(
      await within(open).findAllByRole('button', { name: 'Marcar como revisada' }),
    ).toHaveLength(openAlerts.length)
    expect(within(open).getByText('Chispa')).toBeInTheDocument()
  })

  it('moves an alert to the reviewed ones when it is marked', async () => {
    const { db } = setup()
    const open = await screen.findByRole('region', { name: /Alertas abiertas/ })
    const before = db.alerts.filter((a) => a.status === 'OPEN').length
    const [first] = await within(open).findAllByRole('button', { name: 'Marcar como revisada' })

    await userEvent.click(first)

    await screen.findByText(/Alertas revisadas/)
    await vi.waitFor(() => {
      expect(db.alerts.filter((a) => a.status === 'OPEN')).toHaveLength(before - 1)
      expect(within(open).queryAllByRole('button', { name: 'Marcar como revisada' })).toHaveLength(
        before - 1,
      )
    })
    expect(db.alerts.filter((a) => a.status === 'REVIEWED').length).toBeGreaterThan(0)
  })

  it('reviewed alerts have no button to mark them again', async () => {
    const db = new MockDatabase()
    db.alerts.forEach((a) => {
      a.status = 'REVIEWED'
      a.reviewedAt = new Date().toISOString()
    })
    setup(db)

    expect(await screen.findByText('No hay alertas abiertas.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Marcar como revisada' })).not.toBeInTheDocument()
  })

  it('says so when nothing was reviewed yet', async () => {
    const db = new MockDatabase()
    db.alerts.forEach((a) => {
      a.status = 'OPEN'
      a.reviewedAt = null
    })
    setup(db)

    expect(await screen.findByText('Todavía no has revisado ninguna alerta.')).toBeInTheDocument()
  })

  it('explains the failure and keeps the alert open when marking fails', async () => {
    const { api } = setup()
    vi.spyOn(api.alerts, 'markReviewed').mockRejectedValue(new ApiError(0, 'network_error'))
    const open = await screen.findByRole('region', { name: /Alertas abiertas/ })
    const [first] = await within(open).findAllByRole('button', { name: 'Marcar como revisada' })

    await userEvent.click(first)

    expect(
      await screen.findByText('No pudimos marcar la alerta como revisada. Inténtalo otra vez.'),
    ).toBeInTheDocument()
    expect(
      within(open).getAllByRole('button', { name: 'Marcar como revisada' }).length,
    ).toBeGreaterThan(0)
  })

  it('offers a retry when the alerts cannot be loaded', async () => {
    const { api } = setup()
    vi.spyOn(api.alerts, 'list').mockRejectedValue(new ApiError(500, 'unknown_error'))

    expect(await screen.findAllByRole('button', { name: 'Intentar de nuevo' })).not.toHaveLength(0)
  })
})
