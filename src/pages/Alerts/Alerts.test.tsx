import { screen, waitFor, within } from '@testing-library/react'
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
    expect(await within(open).findByText('Cuy Naranja')).toBeInTheDocument()
  })

  it('moves an alert to the reviewed ones of the history when it is marked', async () => {
    const { db } = setup()
    const open = await screen.findByRole('region', { name: /Alertas abiertas/ })
    const before = db.alerts.filter((a) => a.status === 'OPEN').length
    const [first] = await within(open).findAllByRole('button', { name: 'Marcar como revisada' })

    await userEvent.click(first)

    await vi.waitFor(() => {
      expect(db.alerts.filter((a) => a.status === 'OPEN')).toHaveLength(before - 1)
      expect(within(open).queryAllByRole('button', { name: 'Marcar como revisada' })).toHaveLength(
        before - 1,
      )
    })
    const history = screen.getByRole('region', { name: 'Historial de alertas' })
    expect(await within(history).findByText(/Lleva mucho más tiempo/)).toBeInTheDocument()
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

  it('shows the history of the period a page at a time', async () => {
    setup()
    const history = await screen.findByRole('region', { name: 'Historial de alertas' })

    expect(await within(history).findByText(/alertas en este periodo/)).toBeInTheDocument()
    expect(within(history).getByRole('radio', { name: '7 días' })).toHaveAttribute(
      'aria-checked',
      'true',
    )

    await userEvent.click(within(history).getByRole('radio', { name: '30 días' }))
    const more = await within(history).findByRole('button', { name: 'Cargar más' })
    expect(within(history).getByText(/^Mostrando 20 de/)).toBeInTheDocument()

    await userEvent.click(more)

    expect(await within(history).findByText(/^Mostrando (3[0-9]|40) de/)).toBeInTheDocument()
  })

  it('filters the history and offers to clear the filters when nothing matches', async () => {
    const db = new MockDatabase()
    db.alerts.splice(0, db.alerts.length, ...db.alerts.filter((a) => a.level === 'ALERT'))
    setup(db)
    const history = await screen.findByRole('region', { name: 'Historial de alertas' })
    await within(history).findByText(/alertas en este periodo/)

    await userEvent.click(within(history).getByText('Filtros'))
    await userEvent.click(within(history).getByRole('button', { name: 'Crítico' }))

    expect(
      await within(history).findByText('Ninguna alerta coincide con estos filtros.'),
    ).toBeInTheDocument()
    expect(within(history).getByText('1 activo')).toBeInTheDocument()
    await userEvent.click(within(history).getAllByRole('button', { name: 'Quitar filtros' })[0])
    expect(await within(history).findByText(/alertas en este periodo/)).toBeInTheDocument()
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

  it('filters the alerts by cage and says which cage each alert is from', async () => {
    const user = userEvent.setup()
    const db = new MockDatabase()
    db.alerts.push({
      id: 50,
      cageId: 'cage-7f3a9c21',
      guineaPigId: null,
      level: 'ALERT',
      type: 'AUDIO',
      message: 'Chillidos en el patio',
      status: 'OPEN',
      createdAt: new Date().toISOString(),
      reviewedAt: null,
    })
    setup(db)

    const open = await screen.findByRole('region', { name: /Alertas abiertas/ })
    expect(await within(open).findByText('Chillidos en el patio')).toBeInTheDocument()
    expect(await within(open).findByText('Jaula del patio')).toBeInTheDocument()

    await user.click(await screen.findByRole('button', { name: 'Jaula piloto' }))

    await waitFor(() =>
      expect(within(open).queryByText('Chillidos en el patio')).not.toBeInTheDocument(),
    )
    expect(within(open).getByText(/quieta de lo normal/)).toBeInTheDocument()
  })

  it('marks every open alert as reviewed after confirming', async () => {
    const user = userEvent.setup()
    const db = new MockDatabase()
    db.alerts.push({ ...db.alerts[0], id: 60, message: 'Otra alerta abierta' })
    setup(db)
    const open = await screen.findByRole('region', { name: /Alertas abiertas/ })
    await within(open).findByText('Otra alerta abierta')

    await user.click(screen.getByRole('button', { name: 'Marcar todas como revisadas' }))
    expect(screen.getByRole('dialog', { name: '¿Marcar 2 alertas como revisadas?' })).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Sí, ya las revisé' }))

    expect(await screen.findByText('No hay alertas abiertas.')).toBeInTheDocument()
    expect(db.alerts.every((a) => a.status === 'REVIEWED')).toBe(true)
  })
})
